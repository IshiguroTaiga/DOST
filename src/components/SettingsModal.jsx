import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Shield, Palette, Eye, EyeClosed, ClockCounterClockwise, Info } from '@phosphor-icons/react'

import { supabase } from '../lib/supabase'
import { hashPassword, validatePassword } from '../lib/passwordUtils'
import LoadingSpinner from './LoadingSpinner'
import Button from './Button'
import SearchableSelect from './SearchableSelect'
import HeaderFooterModal from './HeaderFooterModal'

export default function SettingsModal({ isOpen, onClose, user, onLogout, onUserUpdate }) {
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState('security')

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [pwdError, setPwdError] = useState('')
    const [pwdSuccess, setPwdSuccess] = useState('')
    const [submittingPwd, setSubmittingPwd] = useState(false)

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'classic')

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentPassword('')
            setNewPassword('')
            setConfirmNewPassword('')
            setPwdError('')
            setPwdSuccess('')
            setActiveTab('security')
            setTheme(localStorage.getItem('theme') || 'classic')
        }
    }, [isOpen])

    const handleThemeChange = async (newTheme) => {
        setTheme(newTheme)
        
        // Apply immediately for smooth UX
        document.documentElement.setAttribute('data-theme', newTheme)
        
        if (supabase && user?.id) {
            try {
                const { error } = await supabase
                    .from('users')
                    .update({ theme: newTheme })
                    .eq('id', user.id)

                if (error) throw error

                // Update global state and session
                onUserUpdate?.({ ...user, theme: newTheme })
            } catch (err) {
                console.error('[Settings] Failed to save theme:', err)
                // Optionally fallback or notify
            }
        } else {
            // Guest or non-DB fallback
            localStorage.setItem('theme', newTheme)
        }
    }



    if (!isOpen) return null

    // Escape key to close
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        setPwdError('')
        setPwdSuccess('')

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setPwdError('Please fill in all password fields.')
            return
        }

        if (newPassword !== confirmNewPassword) {
            setPwdError('New passwords do not match.')
            return
        }

        const pwdValidation = validatePassword(newPassword)
        if (!pwdValidation.valid) {
            setPwdError(pwdValidation.message)
            return
        }

        if (!supabase || !user) {
            setPwdError('Database not configured or user not found.')
            return
        }

        setSubmittingPwd(true)

        try {
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('password_hash')
                .eq('id', user.id)
                .single()

            if (fetchError || !userData) {
                throw new Error('Failed to verify current password.')
            }

            const currentHashInput = await hashPassword(currentPassword, user.email)
            if (currentHashInput !== userData.password_hash) {
                throw new Error('Current password is incorrect.')
            }

            const newHash = await hashPassword(newPassword, user.email)

            // Update the db
            const { error: updateError } = await supabase
                .from('users')
                .update({ password_hash: newHash })
                .eq('id', user.id)

            if (updateError) throw updateError

            // Log the action
            await supabase
                .from('activity_logs')
                .insert({
                    user_id: user.id,
                    action: 'Changed password',
                    details: 'User voluntarily changed password via Settings Modal'
                })

            setPwdSuccess('Password changed successfully! Logging out...')

            // Force logout
            setTimeout(() => {
                onLogout?.()
            }, 1500)

        } catch (err) {
            setPwdError(err.message || 'Error changing password.')
        } finally {
            setSubmittingPwd(false)
        }
    }

    return (
        <HeaderFooterModal
            isOpen={isOpen}
            onClose={onClose}
            title="Settings & Profile"
            subtitle={<>{user?.email} • <span className="text-primary">{user?.account_type || user?.role}</span></>}
            maxWidth="650px"
            bodyPadding="0"
            className="settings-modal-content"
        >
            <div className="modal-body-p0" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Modal Sidebar Tabs */}
                <div className="modal-sidebar">
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`modal-sidebar-tab ${activeTab === 'security' ? 'active' : ''}`}
                    >
                        <Shield size={16} /> Security
                    </button>

                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`modal-sidebar-tab ${activeTab === 'appearance' ? 'active' : ''}`}
                    >
                        <Palette size={16} /> Appearance
                    </button>


                    <button
                        onClick={() => {
                            onClose()
                            navigate('/event-logs')
                        }}
                        className="modal-sidebar-tab"
                    >
                        <ClockCounterClockwise size={16} /> Event Logs
                    </button>
                    <button
                        onClick={() => {
                            navigate('/manual')
                            onClose()
                        }}
                        className="modal-sidebar-tab"
                    >
                        <Info size={16} /> Help & Manual
                    </button>
                </div>

                {/* Modal Content Area */}
                <div className="modal-body-content">
                    {activeTab === 'security' && (
                        <div className="settings-tab-pane">
                            <h3 className="settings-section-title">Change Password</h3>
                            <p className="settings-section-desc">Ensure your account is using a long, random password to stay secure.</p>

                            <form onSubmit={handlePasswordSubmit}>
                                <div className="form-group">
                                    <label className="settings-label">Current Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="event-modal-input"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="password-toggle-btn">
                                            {showCurrent ? <EyeClosed size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="settings-label">New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="At least 8 chars, uppercase & lowercase"
                                            className="event-modal-input"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowNew(!showNew)} className="password-toggle-btn">
                                            {showNew ? <EyeClosed size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="settings-label">Confirm New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            className="event-modal-input"
                                            required
                                        />
                                    </div>
                                </div>

                                {pwdError && <div className="settings-error-msg">{pwdError}</div>}
                                {pwdSuccess && <div className="settings-success-msg">{pwdSuccess}</div>}

                                <Button
                                    type="submit"
                                    variant="solid"
                                    color="primary"
                                    isLoading={submittingPwd}
                                    style={{ width: '100%' }}
                                >
                                    Update Password
                                </Button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="settings-tab-pane">
                            <h3 className="settings-section-title">UI Theme</h3>
                            <p className="settings-section-desc">Choose between the classic interface or the modern style guide palette.</p>
                            
                            <div className="theme-selector-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                                <div 
                                    className={`theme-option-card ${theme === 'classic' ? 'active' : ''}`}
                                    onClick={() => handleThemeChange('classic')}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid',
                                        borderColor: theme === 'classic' ? 'var(--accent)' : 'var(--border-color)',
                                        cursor: 'pointer',
                                        background: theme === 'classic' ? 'var(--accent-glow)' : 'transparent',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Classic</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard PROACT interface colors</div>
                                </div>

                                <div 
                                    className={`theme-option-card ${theme === 'modern' ? 'active' : ''}`}
                                    onClick={() => handleThemeChange('modern')}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid',
                                        borderColor: theme === 'modern' ? 'var(--accent)' : 'var(--border-color)',
                                        cursor: 'pointer',
                                        background: theme === 'modern' ? 'var(--accent-glow)' : 'transparent',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Modern</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vibrant blue & style guide palette</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </HeaderFooterModal>
    )
}
