
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { generateId, queryMany, queryOne, execute, fromUnix } from '../lib/db';
import type { AppEnv } from '../index';

const fundedAccounts = new Hono<AppEnv>();
fundedAccounts.use('*', authMiddleware);

const createSchema = z.object({
    propFirmName: z.string().min(1),
    accountSize: z.number().positive(),
    startingBalance: z.number().positive(),
    dailyDrawdownLimit: z.number().positive(),
    maxDrawdownLimit: z.number().positive(),
    profitTarget: z.number().positive(),
    accountId: z.string().optional().nullable(),
    step: z.number().int().min(1).default(1),
    currentStep: z.number().int().min(1).default(1),
    drawdownType: z.enum(['STATIC', 'TRAILING', 'TRAILING_HIGH_WATERMARK']).default('STATIC'),
});

function serializeFundedAccount(row: Record<string, unknown>) {
    return {
        id: row.id,
        userId: row.userId,
        accountId: row.accountId,
        propFirmName: row.propFirmName,
        accountSize: row.accountSize,
        startingBalance: row.startingBalance,
        dailyDrawdownLimit: row.dailyDrawdownLimit,
        maxDrawdownLimit: row.maxDrawdownLimit,
        profitTarget: row.profitTarget,
        status: row.status,
        step: row.step,
        currentStep: row.currentStep,
        drawdownType: row.drawdownType,
        createdAt: fromUnix(row.createdAt as number),
        updatedAt: fromUnix(row.updatedAt as number),
    };
}

// GET /api/funded-accounts
fundedAccounts.get('/', async (c) => {
    const userId = c.get('userId');
    const rows = await queryMany<Record<string, unknown>>(
        c.env.DB,
        'SELECT * FROM funded_accounts WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
    );
    return c.json({ fundedAccounts: rows.map(serializeFundedAccount) });
});

// GET /api/funded-accounts/:id
fundedAccounts.get('/:id', async (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const row = await queryOne<Record<string, unknown>>(
        c.env.DB,
        'SELECT * FROM funded_accounts WHERE id = ? AND userId = ?',
        [id, userId]
    );
    if (!row) return c.json({ error: 'Funded account not found' }, 404);
    return c.json(serializeFundedAccount(row));
});

// POST /api/funded-accounts
fundedAccounts.post('/', async (c) => {
    const userId = c.get('userId');
    try {
        const body = await c.req.json();
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);
        
        const d = parsed.data;
        const id = generateId();
        const now = Math.floor(Date.now() / 1000);

        await execute(c.env.DB, `
            INSERT INTO funded_accounts (
                id, userId, accountId, propFirmName, accountSize, startingBalance,
                dailyDrawdownLimit, maxDrawdownLimit, profitTarget, status,
                step, currentStep, drawdownType, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'EVALUATION', ?, ?, ?, ?, ?)`,
            [
                id, userId, d.accountId || null, d.propFirmName, d.accountSize, d.startingBalance,
                d.dailyDrawdownLimit, d.maxDrawdownLimit, d.profitTarget,
                d.step, d.currentStep, d.drawdownType, now, now
            ]
        );

        const row = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM funded_accounts WHERE id = ?', [id]);
        return c.json(serializeFundedAccount(row!), 201);
    } catch (err: any) {
        return c.json({ error: 'Internal server error', message: err.message }, 500);
    }
});

// PUT /api/funded-accounts/:id
fundedAccounts.put('/:id', async (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const d = body; // Simplified for update
        
        const updates: string[] = [];
        const values: unknown[] = [];
        const fields = [
            'accountId', 'propFirmName', 'accountSize', 'startingBalance',
            'dailyDrawdownLimit', 'maxDrawdownLimit', 'profitTarget', 'status',
            'step', 'currentStep', 'drawdownType'
        ];

        fields.forEach(f => {
            if (d[f] !== undefined) {
                updates.push(`${f} = ?`);
                values.push(d[f]);
            }
        });

        if (updates.length > 0) {
            updates.push('updatedAt = ?');
            values.push(Math.floor(Date.now() / 1000));
            await execute(c.env.DB, `UPDATE funded_accounts SET ${updates.join(', ')} WHERE id = ? AND userId = ?`, [...values, id, userId]);
        }

        const row = await queryOne<Record<string, unknown>>(c.env.DB, 'SELECT * FROM funded_accounts WHERE id = ?', [id]);
        return c.json(serializeFundedAccount(row!));
    } catch (err: any) {
        return c.json({ error: 'Internal server error', message: err.message }, 500);
    }
});

// DELETE /api/funded-accounts/:id
fundedAccounts.delete('/:id', async (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    await execute(c.env.DB, 'DELETE FROM funded_accounts WHERE id = ? AND userId = ?', [id, userId]);
    return c.json({ success: true });
});

export default fundedAccounts;
