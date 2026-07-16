import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, User, AtSign, Mail, Phone, Cake, Lock, Save, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/mobile/hooks/useHaptics';

export interface MobileProfile {
  username: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  upi_id: string | null;
  profile_picture: string | null;
  date_of_birth: string | null;
  provider: string;
}

interface Props {
  uid: string;
  open: boolean;
  onClose: () => void;
  profile: MobileProfile;
  onSaved: (next: MobileProfile) => void;
}

export function ProfileEditSheet({ uid, open, onClose, profile, onSaved }: Props) {
  const { toast } = useToast();
  const haptics = useHaptics();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<MobileProfile>(profile);
  const [avatar, setAvatar] = useState<string>(profile.profile_picture || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(profile);
      setAvatar(profile.profile_picture || '');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [open, profile]);

  const set = (k: keyof MobileProfile, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      toast({ title: 'Image too large', description: 'Please pick an image under 2MB.', variant: 'destructive' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image.', variant: 'destructive' });
      return;
    }
    try {
      setUploading(true);
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${uid}/avatars/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('profiles').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('profiles').getPublicUrl(path);
      setAvatar(data.publicUrl);
      haptics('success');
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    const username = (form.username || '').trim();
    if (!username) {
      toast({ title: 'Username required', variant: 'destructive' });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({ title: 'Invalid username', description: 'Use only letters, numbers and underscores.', variant: 'destructive' });
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast({ title: 'Weak password', description: 'Minimum 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);

      // Username uniqueness
      if (username !== profile.username) {
        const { data: existing } = await supabase
          .from('profiles').select('id').eq('username', username).maybeSingle();
        if (existing && (existing as any).id !== uid) {
          throw new Error('That username is already taken.');
        }
      }

      // Auth credential updates (email-based accounts only)
      if (form.provider === 'email') {
        if (form.email && form.email !== profile.email) {
          const { error } = await supabase.auth.updateUser({ email: form.email });
          if (error) throw new Error(`Email update failed: ${error.message}`);
        }
        if (newPassword) {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw new Error(`Password update failed: ${error.message}`);
        }
      }

      const { error: dbErr } = await supabase
        .from('profiles')
        .update({
          username,
          display_name: form.display_name || username,
          email: form.email || null,
          phone: form.phone || null,
          upi_id: form.upi_id || null,
          profile_picture: avatar || null,
          date_of_birth: form.date_of_birth || null,
        } as any)
        .eq('id', uid);
      if (dbErr) throw new Error(dbErr.message);

      localStorage.setItem(STORAGE_KEYS.USER_NAME, username);
      if (avatar) localStorage.setItem('quiz_app_user_avatar', avatar);

      haptics('success');
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
      onSaved({ ...form, username, profile_picture: avatar || null });
      onClose();
    } catch (err) {
      haptics('error');
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col bg-slate-50 shadow-2xl"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 bg-white shadow-sm border-b-2 border-slate-200">
            <button onClick={onClose} className="p-2 -ml-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <h2 className="font-black text-xl text-primary tracking-wide">Edit Profile</h2>
            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center border-4 border-white shadow-md bg-slate-100">
                  {avatar ? (
                    <img src={avatar} alt="Your profile picture" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white hover:bg-primary/90 transition-colors"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
              <p className="text-[11px] font-bold text-slate-500">Tap the camera to change your avatar</p>
            </div>

            <Section title="Profile details">
              <Field icon={User} label="Display name" value={form.display_name || ''} onChange={(v) => set('display_name', v)} placeholder="Your name" />
              <Field icon={AtSign} label="Username" value={form.username || ''} onChange={(v) => set('username', v)} placeholder="username" />
              <Field icon={Cake} label="Date of birth" type="date" value={form.date_of_birth || ''} onChange={(v) => set('date_of_birth', v)} />
            </Section>

            <Section title="Contact">
              <Field icon={Mail} label="Email" type="email" value={form.email || ''} onChange={(v) => set('email', v)} placeholder="you@email.com" disabled={form.provider !== 'email'} />
              <Field icon={Phone} label="Phone" type="tel" value={form.phone || ''} onChange={(v) => set('phone', v)} placeholder="Phone number" />
              <Field icon={CreditCard} label="UPI ID" value={form.upi_id || ''} onChange={(v) => set('upi_id', v)} placeholder="name@bank" />
            </Section>

            {form.provider === 'email' && (
              <Section title="Change password">
                <Field icon={Lock} label="New password" type="password" value={newPassword} onChange={setNewPassword} placeholder="••••••" />
                <Field icon={Lock} label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••" />
              </Section>
            )}

            {form.provider !== 'email' && (
              <p className="text-xs font-bold text-slate-400 text-center">Email and password are managed by your sign-in provider.</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-4 bg-white border-t-2 border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 btn-3d btn-3d-primary disabled:opacity-60 font-black uppercase tracking-wider text-[13px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 panel-3d bg-white p-5">
      <p className="text-[11px] font-black uppercase tracking-widest text-primary border-b-2 border-slate-100 pb-2 mb-3">{title}</p>
      {children}
    </div>
  );
}

function Field({
  icon: Icon, label, value, onChange, placeholder, type = 'text', disabled,
}: {
  icon: any; label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 ml-1">{label}</span>
      <div className={`flex items-center gap-2 rounded-xl px-4 bg-slate-50 border-2 border-slate-200 focus-within:border-primary/50 transition-colors ${disabled ? 'opacity-60' : ''}`}>
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent py-3 text-sm font-bold outline-none text-slate-800 placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
      </div>
    </label>
  );
}