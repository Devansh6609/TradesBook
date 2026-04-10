'use client'

import React, { useState, useEffect } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PROP_FIRMS, PropFirm, PropFirmChallenge } from '@/lib/constants/prop-firms'
import { 
    Target, Shield, ArrowRight, ArrowLeft, 
    Building2, Wallet, Zap, ShieldCheck, 
    Rocket, Activity, Check, Info, Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddFundedAccountModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (data: any) => void
    accounts: { id: string, brokerName: string, accountNumber: string }[]
}

export function AddFundedAccountModal({ isOpen, onClose, onAdd, accounts }: AddFundedAccountModalProps) {
    const [step, setStep] = useState(1)
    const [selectedFirm, setSelectedFirm] = useState<string>('')
    const [selectedChallenge, setSelectedChallenge] = useState<string>('')
    const [selectedAccountSize, setSelectedAccountSize] = useState<number>(0)
    const [linkedAccountId, setLinkedAccountId] = useState<string>('')
    const [customRules, setCustomRules] = useState({
        dailyDrawdown: 5,
        maxDrawdown: 10,
        profitTarget: 10,
        startingBalance: 100000
    })

    const firms = Object.keys(PROP_FIRMS)
    const firmData = selectedFirm ? PROP_FIRMS[selectedFirm] : null
    
    const handleFirmSelect = (firm: string) => {
        setSelectedFirm(firm)
        setSelectedChallenge('')
        setSelectedAccountSize(0)
        setStep(2)
    }

    const handleChallengeSelect = (challengeName: string) => {
        setSelectedChallenge(challengeName)
        const challenge = firmData?.challenges.find(c => c.name === challengeName)
        if (challenge) {
            const firstStep = challenge.steps[0]
            setCustomRules({
                ...customRules,
                dailyDrawdown: firstStep.daily_drawdown_pct,
                maxDrawdown: firstStep.max_drawdown_pct,
                profitTarget: firstStep.profit_target_pct
            })
        }
    }

    const handleAccountSizeSelect = (size: number) => {
        setSelectedAccountSize(size)
        setCustomRules({ ...customRules, startingBalance: size })
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const handleNext = () => {
        if (step < 3) setStep(step + 1)
    }

    const handleSubmit = () => {
        const challenge = firmData?.challenges.find(c => c.name === selectedChallenge)
        onAdd({
            propFirmName: selectedFirm === 'Custom' ? 'Custom' : selectedFirm,
            accountSize: selectedAccountSize || customRules.startingBalance,
            startingBalance: customRules.startingBalance,
            dailyDrawdownLimit: customRules.dailyDrawdown,
            maxDrawdownLimit: customRules.maxDrawdown,
            profitTarget: customRules.profitTarget,
            accountId: linkedAccountId,
            step: challenge?.steps.length || 1,
            currentStep: 1,
            drawdownType: challenge?.steps[0].drawdown_type?.toUpperCase() || 'STATIC'
        })
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                        <Settings2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <span className="text-xl font-black uppercase tracking-tighter block italic leading-none">Initialize</span>
                        <span className="text-[10px] font-bold text-foreground-disabled/30 uppercase tracking-[.3em]">Protocol Staging</span>
                    </div>
                </div>
            }
            size="lg"
            className="bg-[#0a0a0a] border-white/5 rounded-[3rem] overflow-hidden"
        >
            <div className="space-y-12 py-6 px-2">
                {/* Stepper Infrastructure */}
                <div className="flex items-center justify-center gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className={cn(
                                "h-1.5 w-16 rounded-full transition-all duration-700",
                                step === i ? "bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]" : 
                                step > i ? "bg-blue-600/30" : "bg-white/5"
                            )} />
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="grid grid-cols-2 gap-4">
                            {firms.map(firm => (
                                <button
                                    key={firm}
                                    onClick={() => handleFirmSelect(firm)}
                                    className={cn(
                                        "p-8 rounded-[2rem] border text-left transition-all group relative overflow-hidden h-40 flex flex-col justify-between",
                                        selectedFirm === firm 
                                            ? "border-blue-500/50 bg-blue-500/10 shadow-[inner_0_0_40px_rgba(59,130,246,0.1)]" 
                                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                                    )}
                                >
                                    <Building2 className={cn("w-8 h-8", selectedFirm === firm ? "text-blue-400" : "text-foreground-disabled/10")} />
                                    <div className="space-y-1">
                                        <span className={cn("text-xs font-black uppercase tracking-[.25em]", selectedFirm === firm ? "text-blue-400" : "text-foreground")}>{firm}</span>
                                        <p className="text-[9px] font-bold text-foreground-disabled/30 uppercase tracking-widest">Global Prop Partner</p>
                                    </div>
                                </button>
                            ))}
                            <button
                                onClick={() => handleFirmSelect('Custom')}
                                className={cn(
                                    "p-8 rounded-[2rem] border text-left transition-all group relative overflow-hidden h-40 flex flex-col justify-between",
                                    selectedFirm === 'Custom' 
                                        ? "border-blue-500/50 bg-blue-500/10 shadow-[inner_0_0_40px_rgba(59,130,246,0.1)]" 
                                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                                )}
                            >
                                <Target className={cn("w-8 h-8", selectedFirm === 'Custom' ? "text-blue-400" : "text-foreground-disabled/10")} />
                                <div className="space-y-1">
                                    <span className={cn("text-xs font-black uppercase tracking-[.25em]", selectedFirm === 'Custom' ? "text-blue-400" : "text-foreground")}>Manual Rules</span>
                                    <p className="text-[9px] font-bold text-foreground-disabled/30 uppercase tracking-widest">Override Configuration</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {selectedFirm !== 'Custom' ? (
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-foreground-disabled/30 uppercase tracking-[.3em] flex items-center gap-2">
                                        <Shield className="w-3 h-3" /> Selected Challenge Matrix
                                    </p>
                                    <Select
                                        value={selectedChallenge}
                                        onChange={(val) => handleChallengeSelect(val as string)}
                                        placeholder="Select Tier Structure..."
                                        options={firmData?.challenges.map(c => ({ value: c.name, label: c.name })) || []}
                                        className="bg-white/5 border-white/5 rounded-2xl h-16 font-black uppercase text-[11px] tracking-widest"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-foreground-disabled/30 uppercase tracking-[.3em] flex items-center gap-2">
                                        <Wallet className="w-3 h-3" /> Capital Allocation
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {firmData?.accounts.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => handleAccountSizeSelect(size)}
                                                className={cn(
                                                    "h-16 rounded-2xl border text-[11px] font-black transition-all uppercase tracking-widest",
                                                    selectedAccountSize === size 
                                                        ? "border-blue-500/50 bg-blue-600 text-white shadow-[0_15px_30px_rgba(59,130,246,0.3)]" 
                                                        : "border-white/5 bg-white/5 text-foreground-disabled/40 hover:bg-white/10"
                                                )}
                                            >
                                                ${size.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-8 bg-white/[0.02] p-10 rounded-[2.5rem] border border-white/5">
                                <Input
                                    label="Source Liquidity ($)"
                                    type="number"
                                    value={customRules.startingBalance}
                                    onChange={(e) => setCustomRules({ ...customRules, startingBalance: Number(e.target.value) })}
                                    className="bg-black/40 border-white/10 rounded-2xl h-14"
                                />
                                <Input
                                    label="Profit Target (%)"
                                    type="number"
                                    value={customRules.profitTarget}
                                    onChange={(e) => setCustomRules({ ...customRules, profitTarget: Number(e.target.value) })}
                                    className="bg-black/40 border-white/10 rounded-2xl h-14"
                                />
                                <Input
                                    label="Max Daily Threshold (%)"
                                    type="number"
                                    value={customRules.dailyDrawdown}
                                    onChange={(e) => setCustomRules({ ...customRules, dailyDrawdown: Number(e.target.value) })}
                                    className="bg-black/40 border-white/10 rounded-2xl h-14"
                                />
                                <Input
                                    label="Terminal Drawdown (%)"
                                    type="number"
                                    value={customRules.maxDrawdown}
                                    onChange={(e) => setCustomRules({ ...customRules, maxDrawdown: Number(e.target.value) })}
                                    className="bg-black/40 border-white/10 rounded-2xl h-14"
                                />
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="p-10 rounded-[2.5rem] bg-[#0d0d0d] border border-blue-500/20 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 blur-3xl -z-10" />
                             <div className="flex items-center gap-5 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                                    <ShieldCheck className="w-8 h-8 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Protocol Verified</h4>
                                    <p className="text-[10px] font-bold text-foreground-disabled/30 uppercase tracking-[.25em]">{selectedFirm} Matrix ready</p>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-foreground-disabled/20 uppercase tracking-widest">Objective</p>
                                    <p className="text-lg font-black text-green-500">+{customRules.profitTarget}%</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-foreground-disabled/20 uppercase tracking-widest">Risk Floor</p>
                                    <p className="text-lg font-black text-red-500">-{customRules.maxDrawdown}%</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-foreground-disabled/20 uppercase tracking-widest">Allocation</p>
                                    <p className="text-lg font-black text-white">${selectedAccountSize.toLocaleString()}</p>
                                </div>
                             </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-foreground-disabled/30 uppercase tracking-[.3em] block ml-1 flex items-center gap-2">
                                <Wallet className="w-3 h-3" /> Connect Live Terminal
                            </label>
                            <Select
                                value={linkedAccountId}
                                onChange={(val) => setLinkedAccountId(val as string)}
                                placeholder="Establish Data Uplink..."
                                options={accounts.map(acc => ({
                                    value: acc.id,
                                    label: `${acc.brokerName} ┃ ${acc.accountNumber}`
                                }))}
                                className="h-16 bg-white/5 border-white/5 rounded-2xl font-black uppercase text-[11px] tracking-widest"
                            />
                            <div className="flex items-start gap-4 p-5 bg-blue-600/5 rounded-2xl border border-blue-600/10 mt-6">
                                <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                <p className="text-[10px] font-bold text-blue-400/60 uppercase leading-loose tracking-[.15em]">
                                    Rule engine synchronization active. Violation monitoring will be performed at the hardware level.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ModalFooter className="mt-8 bg-white/[0.02] border-t border-white/5 p-10 flex gap-4">
                {step > 1 && (
                    <Button 
                        variant="ghost" 
                        onClick={handleBack} 
                        className="mr-auto h-14 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 border border-white/5 bg-white/[0.01]"
                    >
                        <ArrowLeft className="w-4 h-4 mr-3" /> Back
                    </Button>
                )}
                
                {step < 3 ? (
                    <Button 
                        disabled={(step === 2 && !selectedAccountSize && selectedFirm !== 'Custom')}
                        onClick={handleNext}
                        className="h-14 px-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_15px_40px_rgba(59,130,246,0.3)] transition-all ml-auto"
                    >
                        Continue <ArrowRight className="w-4 h-4 ml-3" />
                    </Button>
                ) : (
                    <Button 
                        onClick={handleSubmit} 
                        className="h-14 px-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_15px_40px_rgba(59,130,246,0.4)] transition-all animate-pulse ml-auto"
                    >
                        Confirm Setup
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    )
}
