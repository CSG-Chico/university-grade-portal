import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  GraduationCap, ShieldCheck, Upload, Download, Search, 
  LogOut, Eye, EyeOff, Trash2, CheckCircle2, AlertCircle, 
  Lock, Pencil, Check, X, Mail, Send, UserCheck, KeyRound, 
  ArrowLeft, UserPlus, Users, BookOpen, Clock, ChevronRight,
  Settings, RefreshCw
} from 'lucide-react';

// Initialize Supabase Client from your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// EmailJS Credentials from .env
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SAVED_INSTRUCTORS_KEY = 'ugp_saved_instructors_v1';

const checkIsTeacherRoute = () => {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path.startsWith('/teacher') || path.startsWith('/admin') || hash.startsWith('#/teacher') || hash.startsWith('#/admin');
};

// HELPER: Evaluate Password Strength Requirements
const evaluatePasswordStrength = (pwd = '') => {
  const checks = {
    minLength: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/']/.test(pwd),
  };
  const isValid = Object.values(checks).every(Boolean);
  return { checks, isValid };
};

// Reusable Live Password Requirements Checklist Component
function PasswordStrengthChecklist({ password, confirmPassword, currentPassword = null }) {
  const { checks } = evaluatePasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isDifferentFromCurrent =
    currentPassword === null
      ? true
      : password.length > 0 && password !== currentPassword;

  const items = [
    { key: 'minLength', label: 'At least 8 characters', met: checks.minLength },
    { key: 'hasUpper', label: 'Uppercase letter (A-Z)', met: checks.hasUpper },
    { key: 'hasLower', label: 'Lowercase letter (a-z)', met: checks.hasLower },
    { key: 'hasNumber', label: 'Number (0-9)', met: checks.hasNumber },
    { key: 'hasSpecial', label: 'Special character (!@#$%^&*)', met: checks.hasSpecial },
    { key: 'match', label: 'Passwords match', met: passwordsMatch },
  ];

  if (currentPassword !== null) {
    items.push({
      key: 'notSameAsCurrent',
      label: 'Different from current password',
      met: isDifferentFromCurrent,
    });
  }

  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
        Password Security Requirements
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {items.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-1.5 text-xs font-medium ${
              item.met ? 'text-emerald-700' : 'text-slate-400'
            }`}
          >
            {item.met ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [isTeacherRoute, setIsTeacherRoute] = useState(checkIsTeacherRoute());

  useEffect(() => {
    const handleRouteChange = () => setIsTeacherRoute(checkIsTeacherRoute());
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  // ================= STUDENT PORTAL STATE =================
  const [studentTab, setStudentTab] = useState('login'); // 'login' | 'register'
  const [studentIdInput, setStudentIdInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [studentRecords, setStudentRecords] = useState(null);
  const [studentError, setStudentError] = useState('');
  const [studentSuccess, setStudentSuccess] = useState('');
  const [loadingStudent, setLoadingStudent] = useState(false);

  const [regStudentId, setRegStudentId] = useState('');
  const [regGmail, setRegGmail] = useState('');
  const [sendingStudentPin, setSendingStudentPin] = useState(false);

  // ================= INSTRUCTOR & SUPER ADMIN STATE =================
  const [teacherAuthTab, setTeacherAuthTab] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [currentInstructor, setCurrentInstructor] = useState(null);
  const [teacherViewTab, setTeacherViewTab] = useState('grades'); // 'grades' | 'faculty' | 'profile'

  // Saved Instructor Accounts in Browser LocalStorage
  const [savedInstructors, setSavedInstructors] = useState(() => {
    try {
      const raw = localStorage.getItem(SAVED_INSTRUCTORS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [selectedSavedAccount, setSelectedSavedAccount] = useState(null);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'pin'
  const [generatedLoginPin, setGeneratedLoginPin] = useState(null);
  const [instructorPinInput, setInstructorPinInput] = useState('');
  const [sendingInstructorPin, setSendingInstructorPin] = useState(false);

  // Standard Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [teacherAuthError, setTeacherAuthError] = useState('');
  const [teacherAuthSuccess, setTeacherAuthSuccess] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Self-Service Forgot Password State (Independent Eye Toggles)
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [generatedResetPin, setGeneratedResetPin] = useState(null);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPass, setShowResetNewPass] = useState(false);
  const [showResetConfirmPass, setShowResetConfirmPass] = useState(false);
  const [sendingResetPin, setSendingResetPin] = useState(false);

  // Logged-In Instructor Profile & Security Verification Modal State
  const [profileName, setProfileName] = useState('');
  const [profileDept, setProfileDept] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileStatusMsg, setProfileStatusMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile Update 2-Step Verification Modal State (Password OR Email PIN)
  const [showProfileVerify, setShowProfileVerify] = useState(false);
  const [profileVerifyMethod, setProfileVerifyMethod] = useState('password'); // 'password' | 'pin'
  const [profileVerifyPassword, setProfileVerifyPassword] = useState('');
  const [showProfileVerifyPass, setShowProfileVerifyPass] = useState(false);
  const [profileGeneratedPin, setProfileGeneratedPin] = useState(null);
  const [profileVerifyPinInput, setProfileVerifyPinInput] = useState('');
  const [sendingProfilePin, setSendingProfilePin] = useState(false);
  const [profileVerifyMsg, setProfileVerifyMsg] = useState({ type: '', text: '' });

  // Change Password State (3 Independent Eye Toggles!)
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordStatusMsg, setPasswordStatusMsg] = useState({ type: '', text: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  // Super Admin Manual Password Reset Modal State (With Confirm Password & Validation)
  const [adminResetFaculty, setAdminResetFaculty] = useState(null);
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [showAdminResetPass, setShowAdminResetPass] = useState(false);
  const [showAdminResetConfirmPass, setShowAdminResetConfirmPass] = useState(false);
  const [adminResetMsg, setAdminResetMsg] = useState({ type: '', text: '' });
  const [facultyActionBanner, setFacultyActionBanner] = useState('');
  const [savingAdminReset, setSavingAdminReset] = useState(false);

  // Allow closing active modals with the Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showProfileVerify) {
          setShowProfileVerify(false);
          setProfileVerifyMsg({ type: '', text: '' });
        }
        if (adminResetFaculty) {
          setAdminResetFaculty(null);
          setAdminNewPass('');
          setAdminConfirmPass('');
          setAdminResetMsg({ type: '', text: '' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProfileVerify, adminResetFaculty]);

  // Instructor Signup Form (2 Independent Eye Toggles!)
  const [signupName, setSignupName] = useState('');
  const [signupDept, setSignupDept] = useState('CCIT');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showSignupConfirmPass, setShowSignupConfirmPass] = useState(false);

  // Grades & Faculty List State
  const [allRecords, setAllRecords] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingEmailId, setSendingEmailId] = useState(null);

  // Inline Editing State for Instructor
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    email: '',
    pin: '',
    midterm_grade: '',
    final_grade: '',
    breakdown: '',
    remarks: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // HELPER: Save Instructor Profile Card to LocalStorage
  const rememberInstructorOnDevice = (instructor) => {
    const profileToSave = {
      id: instructor.id,
      full_name: instructor.full_name,
      email: instructor.email.toLowerCase(),
      department: instructor.department || 'CCIT',
      role: instructor.role || 'instructor',
      last_login: new Date().toISOString(),
    };

    setSavedInstructors((prev) => {
      const filtered = prev.filter((item) => item.id !== profileToSave.id && item.email !== profileToSave.email);
      const updated = [profileToSave, ...filtered];
      localStorage.setItem(SAVED_INSTRUCTORS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // HELPER: Remove a Saved Instructor Card from This Device
  const removeSavedInstructor = (emailToRemove, e) => {
    e.stopPropagation();
    setSavedInstructors((prev) => {
      const updated = prev.filter((item) => item.email !== emailToRemove);
      localStorage.setItem(SAVED_INSTRUCTORS_KEY, JSON.stringify(updated));
      return updated;
    });
    if (selectedSavedAccount?.email === emailToRemove) {
      setSelectedSavedAccount(null);
    }
  };

  // HELPER: Send PIN Email via EmailJS REST API
  const sendPinEmail = async (record, targetEmail) => {
    const emailToUse = (targetEmail || record.email || '').trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      throw new Error(`Please provide a valid email address.`);
    }
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      throw new Error('Missing EmailJS credentials in .env file.');
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: emailToUse,
          student_name: record.full_name,
          student_id: record.student_id,
          pin: record.pin,
          subject: `${record.subject} (${record.instructor_name || 'Portal Security'})`,
          section: record.section,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to send email via EmailJS');
    }
  };

  // ================= 1. STUDENT PORTAL FUNCTIONS =================
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setStudentError('');
    setStudentSuccess('');
    setLoadingStudent(true);

    const { data, error } = await supabase
      .from('student_grades')
      .select('*')
      .eq('student_id', studentIdInput.trim())
      .eq('pin', pinInput.trim());

    setLoadingStudent(false);

    if (error) {
      setStudentError('Database error: ' + error.message);
      return;
    }

    if (!data || data.length === 0) {
      setStudentError('Invalid Student ID or PIN. Need your PIN? Click the "Register Gmail / PIN" tab above.');
      return;
    }

    setStudentRecords(data);
  };

  const handleStudentRegisterGmail = async (e) => {
    e.preventDefault();
    setStudentError('');
    setStudentSuccess('');

    const cleanId = regStudentId.trim();
    const cleanEmail = regGmail.trim().toLowerCase();

    if (!cleanEmail.endsWith('@gmail.com')) {
      setStudentError('Please enter a valid personal @gmail.com address.');
      return;
    }

    setSendingStudentPin(true);

    const { data, error } = await supabase
      .from('student_grades')
      .select('*')
      .eq('student_id', cleanId);

    if (error) {
      setSendingStudentPin(false);
      setStudentError('Database error: ' + error.message);
      return;
    }

    if (!data || data.length === 0) {
      setSendingStudentPin(false);
      setStudentError('Student ID not found. Make sure you entered your exact University ID (e.g., 26-20437).');
      return;
    }

    const studentRecord = data[0];
    const existingEmail = (studentRecord.email || '').trim().toLowerCase();

    if (existingEmail) {
      if (existingEmail !== cleanEmail) {
        const [userPart, domainPart] = existingEmail.split('@');
        const masked = `${userPart.slice(0, 2)}***@${domainPart}`;
        setSendingStudentPin(false);
        setStudentError(
          `Locked: This Student ID is already permanently linked to ${masked}. Students cannot change their registered Gmail. Please contact your instructor if you need it reset.`
        );
        return;
      }

      try {
        await sendPinEmail(studentRecord, existingEmail);
        setStudentSuccess(`Your PIN has been re-sent to your registered Gmail (${existingEmail}).`);
        setStudentIdInput(cleanId);
        setStudentTab('login');
      } catch (err) {
        setStudentError(err.message);
      } finally {
        setSendingStudentPin(false);
      }
      return;
    }

    try {
      const { error: updateErr } = await supabase
        .from('student_grades')
        .update({ email: cleanEmail, updated_at: new Date().toISOString() })
        .eq('student_id', cleanId)
        .or('email.is.null,email.eq.');

      if (updateErr) throw new Error(updateErr.message);

      await sendPinEmail(studentRecord, cleanEmail);

      setStudentSuccess(
        `Success! ${cleanEmail} is now permanently linked to your Student ID, and your PIN has been sent.`
      );
      setStudentIdInput(cleanId);
      setStudentTab('login');
    } catch (err) {
      setStudentError(err.message);
    } finally {
      setSendingStudentPin(false);
    }
  };

  // ================= 2. INSTRUCTOR & SUPER ADMIN AUTH =================
  const completeInstructorLogin = (instructorData) => {
    rememberInstructorOnDevice(instructorData);
    setCurrentInstructor(instructorData);
    setProfileName(instructorData.full_name || '');
    setProfileDept(instructorData.department || 'CCIT');
    setProfileEmail(instructorData.email || '');
    setSelectedSavedAccount(null);
    setLoginPassword('');
    setInstructorPinInput('');
    setGeneratedLoginPin(null);
    setTeacherViewTab('grades');
    fetchInstructorRecords(instructorData);
    if (instructorData.role === 'admin') {
      fetchFacultyList();
    }
  };

  const handleInstructorLogin = async (e) => {
    e.preventDefault();
    setTeacherAuthError('');
    setTeacherAuthSuccess('');
    setLoadingAuth(true);

    const emailToUse =
      selectedSavedAccount && !selectedSavedAccount.isNewManual
        ? selectedSavedAccount.email
        : loginEmail.trim().toLowerCase();

    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('email', emailToUse)
      .eq('password', loginPassword.trim())
      .maybeSingle();

    setLoadingAuth(false);

    if (error) {
      setTeacherAuthError('Database error: ' + error.message);
      return;
    }

    if (!data) {
      setTeacherAuthError('Invalid email or password.');
      return;
    }

    if (data.status === 'pending') {
      setTeacherAuthError('Your instructor account is still PENDING approval by the Super Admin.');
      return;
    }

    if (data.status === 'rejected') {
      setTeacherAuthError('Your instructor account request was declined by the administrator.');
      return;
    }

    completeInstructorLogin(data);
  };

  const handleSendInstructorLoginPin = async () => {
    if (!selectedSavedAccount) return;
    setTeacherAuthError('');
    setTeacherAuthSuccess('');
    setSendingInstructorPin(true);

    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('email', selectedSavedAccount.email)
      .maybeSingle();

    if (error || !data) {
      setSendingInstructorPin(false);
      setTeacherAuthError('Account no longer found in the database.');
      return;
    }

    if (data.status !== 'approved') {
      setSendingInstructorPin(false);
      setTeacherAuthError(`Your account status is currently ${data.status.toUpperCase()}.`);
      return;
    }

    const oneTimePin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedLoginPin(oneTimePin);

    try {
      await sendPinEmail(
        {
          full_name: data.full_name,
          student_id: `INSTRUCTOR (${data.department})`,
          pin: oneTimePin,
          subject: 'Faculty Portal One-Time Login PIN',
          section: 'Instructor Access',
          instructor_name: 'University Grade Portal',
        },
        data.email
      );
      setTeacherAuthSuccess(`A 6-digit login PIN has been sent to ${data.email}!`);
    } catch (err) {
      setTeacherAuthError('Failed to send PIN email: ' + err.message);
    } finally {
      setSendingInstructorPin(false);
    }
  };

  const handleVerifyInstructorPin = async (e) => {
    e.preventDefault();
    setTeacherAuthError('');

    if (!generatedLoginPin || instructorPinInput.trim() !== generatedLoginPin) {
      setTeacherAuthError('Invalid or expired 6-digit PIN. Please check your email and try again.');
      return;
    }

    setLoadingAuth(true);
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('email', selectedSavedAccount.email)
      .maybeSingle();

    setLoadingAuth(false);

    if (error || !data) {
      setTeacherAuthError('Could not load instructor profile.');
      return;
    }

    if (data.status !== 'approved') {
      setTeacherAuthError('Your account is not approved.');
      return;
    }

    completeInstructorLogin(data);
  };

  // ================= 3. SELF-SERVICE FORGOT PASSWORD FLOW =================
  const openForgotPasswordFlow = (prefillEmail = '') => {
    setTeacherAuthTab('forgot');
    setResetEmailInput(prefillEmail || '');
    setResetStep(1);
    setGeneratedResetPin(null);
    setResetCodeInput('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setShowResetNewPass(false);
    setShowResetConfirmPass(false);
    setTeacherAuthError('');
    setTeacherAuthSuccess('');
  };

  const handleSendPasswordResetCode = async (e) => {
    e.preventDefault();
    setTeacherAuthError('');
    setTeacherAuthSuccess('');

    const cleanEmail = resetEmailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    setSendingResetPin(true);

    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !data) {
      setSendingResetPin(false);
      setTeacherAuthError('No instructor account found with that email address.');
      return;
    }

    const resetPin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedResetPin(resetPin);

    try {
      await sendPinEmail(
        {
          full_name: data.full_name,
          student_id: `PASSWORD RESET (${data.department})`,
          pin: resetPin,
          subject: 'Instructor Password Reset Code',
          section: 'Security Verification',
          instructor_name: 'University Grade Portal',
        },
        data.email
      );
      setResetStep(2);
      setTeacherAuthSuccess(`We sent a 6-digit verification code to ${data.email}.`);
    } catch (err) {
      setTeacherAuthError('Failed to send reset email: ' + err.message);
    } finally {
      setSendingResetPin(false);
    }
  };

  const handleCompletePasswordReset = async (e) => {
    e.preventDefault();
    setTeacherAuthError('');
    setTeacherAuthSuccess('');

    if (!generatedResetPin || resetCodeInput.trim() !== generatedResetPin) {
      setTeacherAuthError('Invalid 6-digit verification code. Please check your email.');
      return;
    }

    const { isValid } = evaluatePasswordStrength(resetNewPassword);
    if (!isValid) {
      setTeacherAuthError(
        'Password does not meet all security requirements (8+ chars, uppercase, lowercase, number, and special character).'
      );
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setTeacherAuthError('New password and confirm password do not match.');
      return;
    }

    setLoadingAuth(true);

    const { data: existingInstructor } = await supabase
      .from('instructors')
      .select('password')
      .eq('email', resetEmailInput.trim().toLowerCase())
      .maybeSingle();

    if (existingInstructor && existingInstructor.password === resetNewPassword) {
      setLoadingAuth(false);
      setTeacherAuthError('Your new password cannot be the same as your current password.');
      return;
    }

    const { error } = await supabase
      .from('instructors')
      .update({ password: resetNewPassword })
      .eq('email', resetEmailInput.trim().toLowerCase());

    setLoadingAuth(false);

    if (error) {
      setTeacherAuthError('Failed to reset password: ' + error.message);
      return;
    }

    setTeacherAuthSuccess('Password updated! You can now sign in with your new password.');
    setLoginEmail(resetEmailInput.trim().toLowerCase());
    setLoginPassword('');
    setTeacherAuthTab('login');
  };

  // ================= 4. LOGGED-IN INSTRUCTOR PROFILE (WITH CENTERED MODAL VERIFICATION) =================
  const handleInitiateProfileSave = (e) => {
    e.preventDefault();
    if (!currentInstructor) return;
    setProfileStatusMsg({ type: '', text: '' });
    setProfileVerifyMsg({ type: '', text: '' });

    const cleanName = profileName.trim().toUpperCase();
    const cleanDept = profileDept.trim() || 'CCIT';
    const cleanEmail = profileEmail.trim().toLowerCase();

    if (!cleanEmail.includes('@')) {
      setProfileStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    const hasChanges =
      cleanName !== currentInstructor.full_name ||
      cleanDept !== (currentInstructor.department || 'CCIT') ||
      cleanEmail !== currentInstructor.email.toLowerCase();

    if (!hasChanges) {
      setProfileStatusMsg({ type: 'error', text: 'No changes were made to your profile.' });
      return;
    }

    setShowProfileVerify(true);
    setProfileVerifyMethod('password');
    setProfileVerifyPassword('');
    setShowProfileVerifyPass(false);
    setProfileGeneratedPin(null);
    setProfileVerifyPinInput('');
  };

  const handleSendProfileVerifyPin = async () => {
    if (!currentInstructor) return;
    setProfileVerifyMsg({ type: '', text: '' });
    setSendingProfilePin(true);

    const oneTimePin = Math.floor(100000 + Math.random() * 900000).toString();
    setProfileGeneratedPin(oneTimePin);

    try {
      await sendPinEmail(
        {
          full_name: currentInstructor.full_name,
          student_id: `PROFILE CHANGE (${currentInstructor.department})`,
          pin: oneTimePin,
          subject: 'Verify Profile / Email Update',
          section: 'Account Security',
          instructor_name: 'University Grade Portal',
        },
        currentInstructor.email
      );
      setProfileVerifyMsg({
        type: 'success',
        text: `A 6-digit verification PIN has been sent to ${currentInstructor.email}.`,
      });
    } catch (err) {
      setProfileVerifyMsg({
        type: 'error',
        text: 'Failed to send verification PIN: ' + err.message,
      });
    } finally {
      setSendingProfilePin(false);
    }
  };

  const handleConfirmAndSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentInstructor) return;
    setProfileVerifyMsg({ type: '', text: '' });

    if (profileVerifyMethod === 'password') {
      if (!profileVerifyPassword) {
        setProfileVerifyMsg({ type: 'error', text: 'Please enter your current password to confirm.' });
        return;
      }

      const { data: authCheck, error: authErr } = await supabase
        .from('instructors')
        .select('id')
        .eq('id', currentInstructor.id)
        .eq('password', profileVerifyPassword)
        .maybeSingle();

      if (authErr || !authCheck) {
        setProfileVerifyMsg({
          type: 'error',
          text: 'Incorrect password. Please try again.',
        });
        return;
      }
    } else {
      if (!profileGeneratedPin || profileVerifyPinInput.trim() !== profileGeneratedPin) {
        setProfileVerifyMsg({
          type: 'error',
          text: 'Invalid 6-digit verification PIN. Please check your email and try again.',
        });
        return;
      }
    }

    setSavingProfile(true);
    const cleanName = profileName.trim().toUpperCase();
    const cleanDept = profileDept.trim() || 'CCIT';
    const cleanEmail = profileEmail.trim().toLowerCase();

    const { data, error } = await supabase
      .from('instructors')
      .update({
        full_name: cleanName,
        department: cleanDept,
        email: cleanEmail,
      })
      .eq('id', currentInstructor.id)
      .select()
      .single();

    if (error) {
      setSavingProfile(false);
      setProfileVerifyMsg({
        type: 'error',
        text: error.message.includes('unique')
          ? 'That email is already in use by another instructor.'
          : 'Failed to update profile: ' + error.message,
      });
      return;
    }

    if (cleanName !== currentInstructor.full_name) {
      await supabase
        .from('student_grades')
        .update({ instructor_name: cleanName })
        .eq('instructor_id', currentInstructor.id);
    }

    setSavingProfile(false);
    setShowProfileVerify(false);
    setProfileVerifyPassword('');
    setProfileGeneratedPin(null);
    setProfileVerifyPinInput('');
    setProfileVerifyMsg({ type: '', text: '' });
    setCurrentInstructor(data);
    rememberInstructorOnDevice(data);
    fetchInstructorRecords(data);
    setProfileStatusMsg({
      type: 'success',
      text: 'Identity verified! Your profile and login email have been updated.',
    });
  };

  // ================= CHANGE PASSWORD (BLOCKS REUSING CURRENT PASSWORD) =================
  const handleUpdateInstructorPassword = async (e) => {
    e.preventDefault();
    if (!currentInstructor) return;
    setPasswordStatusMsg({ type: '', text: '' });

    if (currentPassInput !== currentInstructor.password) {
      setPasswordStatusMsg({ type: 'error', text: 'Your current password is incorrect.' });
      return;
    }

    if (newPassInput === currentPassInput || newPassInput === currentInstructor.password) {
      setPasswordStatusMsg({
        type: 'error',
        text: 'Your new password cannot be the same as your current password. Please choose a different password.',
      });
      return;
    }

    const { isValid } = evaluatePasswordStrength(newPassInput);
    if (!isValid) {
      setPasswordStatusMsg({
        type: 'error',
        text: 'New password must meet all security requirements (8+ chars, uppercase, lowercase, number, and special character).',
      });
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setPasswordStatusMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setSavingPassword(true);
    const { data, error } = await supabase
      .from('instructors')
      .update({ password: newPassInput })
      .eq('id', currentInstructor.id)
      .select()
      .single();

    setSavingPassword(false);

    if (error) {
      setPasswordStatusMsg({ type: 'error', text: 'Error updating password: ' + error.message });
      return;
    }

    setCurrentInstructor(data);
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setShowCurrentPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
    setPasswordStatusMsg({ type: 'success', text: 'Your password has been changed successfully!' });
  };

  // Super Admin: Direct Password Reset Modal Handler (With Confirm Password & Validation)
  const handleAdminResetFacultyPassword = async (e) => {
    e.preventDefault();
    if (!adminResetFaculty) return;
    setAdminResetMsg({ type: '', text: '' });

    const { isValid } = evaluatePasswordStrength(adminNewPass);
    if (!isValid) {
      setAdminResetMsg({
        type: 'error',
        text: 'Password must meet all security requirements (at least 8 characters, uppercase, lowercase, number, and special character).',
      });
      return;
    }

    if (adminNewPass !== adminConfirmPass) {
      setAdminResetMsg({
        type: 'error',
        text: 'New password and confirmation password do not match.',
      });
      return;
    }

    if (adminNewPass === adminResetFaculty.password) {
      setAdminResetMsg({
        type: 'error',
        text: 'The new password cannot be the same as this instructor’s current password.',
      });
      return;
    }

    setSavingAdminReset(true);
    const { error } = await supabase
      .from('instructors')
      .update({ password: adminNewPass })
      .eq('id', adminResetFaculty.id);

    setSavingAdminReset(false);

    if (error) {
      setAdminResetMsg({
        type: 'error',
        text: 'Failed to reset password: ' + error.message,
      });
    } else {
      // If Super Admin reset their own password here, keep currentInstructor in sync
      if (currentInstructor && adminResetFaculty.id === currentInstructor.id) {
        setCurrentInstructor((prev) => ({ ...prev, password: adminNewPass }));
      }
      setFacultyActionBanner(
        `Password for ${adminResetFaculty.full_name} (${adminResetFaculty.email}) has been updated successfully!`
      );
      setAdminResetFaculty(null);
      setAdminNewPass('');
      setAdminConfirmPass('');
      setAdminResetMsg({ type: '', text: '' });
      fetchFacultyList();
    }
  };

  // ================= 5. INSTRUCTOR SIGNUP (WITH STRONG PASSWORD & CONFIRMATION) =================
  const handleInstructorSignup = async (e) => {
    e.preventDefault();
    setTeacherAuthError('');
    setTeacherAuthSuccess('');

    const { isValid } = evaluatePasswordStrength(signupPassword);
    if (!isValid) {
      setTeacherAuthError(
        'Please make sure your password meets all security requirements (at least 8 characters, uppercase, lowercase, number, and special character).'
      );
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setTeacherAuthError('Passwords do not match. Please re-enter your confirmation password.');
      return;
    }

    setLoadingAuth(true);

    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanName = signupName.trim().toUpperCase();

    const { error } = await supabase.from('instructors').insert([
      {
        full_name: cleanName,
        department: signupDept.trim() || 'CCIT',
        email: cleanEmail,
        password: signupPassword,
        role: 'instructor',
        status: 'pending',
      },
    ]);

    setLoadingAuth(false);

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        setTeacherAuthError('An instructor account with this email already exists.');
      } else {
        setTeacherAuthError('Error creating request: ' + error.message);
      }
      return;
    }

    setTeacherAuthSuccess(
      'Account request submitted! Please wait for the Super Admin to approve your account before logging in.'
    );
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setShowSignupPass(false);
    setShowSignupConfirmPass(false);
    setTeacherAuthTab('login');
  };

  const fetchInstructorRecords = async (instructor = currentInstructor) => {
    if (!instructor) return;
    setLoadingTeacher(true);

    const { data, error } = await supabase
      .from('student_grades')
      .select('*')
      .eq('instructor_id', instructor.id)
      .order('subject', { ascending: true })
      .order('section', { ascending: true })
      .order('full_name', { ascending: true });

    if (!error && data) {
      setAllRecords(data);
    }
    setLoadingTeacher(false);
  };

  const fetchFacultyList = async () => {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFacultyList(data);
    }
  };

  const handleUpdateFacultyStatus = async (facultyId, newStatus) => {
    const { error } = await supabase
      .from('instructors')
      .update({ status: newStatus })
      .eq('id', facultyId);

    if (error) {
      alert('Failed to update status: ' + error.message);
    } else {
      fetchFacultyList();
    }
  };

  const handleDeleteFaculty = async (faculty) => {
    if (faculty.role === 'admin') {
      alert('Cannot delete the Super Admin account.');
      return;
    }
    if (!window.confirm(`Delete instructor ${faculty.full_name} and all their uploaded class records?`)) return;
    await supabase.from('instructors').delete().eq('id', faculty.id);
    fetchFacultyList();
  };

  const downloadTemplate = () => {
    const csvContent = [
      'Student ID,Full Name,PIN,Subject,Section,Midterm Grade,Final Grade,Breakdown,Remarks',
      '26-20437,Acibo Anthoneth V.,0437,IT 100 - Living in the IT Era,BSN 1D,1.75,Pending,Quizzes: 45/60 (26.25%) | Activities: 57/95 (12.00%) | Projects: 91/100 (14.32%) | Midterm Exam: 54/60 (38.00%) | Total: 90.58%,Passed',
      '25-19221,ACINCID JAYCOB R.,9221,IT 100 - Living in the IT Era,BSN 1D,2.25,Pending,Quizzes: 33/60 (23.25%) | Activities: 57/95 (12.00%) | Projects: 75/100 (13.12%) | Midterm Exam: 42/60 (34.00%) | Total: 82.38%,Passed'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grades_template_with_final.csv';
    a.click();
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentInstructor) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
      if (lines.length < 2) {
        setUploadStatus('Error: CSV file is empty or missing rows.');
        return;
      }

      const headerCols = lines[0].toLowerCase().split(',').map((h) => h.trim());
      const hasEmailCol = headerCols.includes('email') || headerCols.includes('gmail');
      const hasFinalCol = headerCols.includes('final grade') || headerCols.includes('final_grade');

      const rowsToUpsert = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length >= 6) {
          const baseRow = {
            instructor_id: currentInstructor.id,
            instructor_name: currentInstructor.full_name,
          };

          if (hasEmailCol && hasFinalCol) {
            rowsToUpsert.push({
              ...baseRow,
              student_id: cols[0],
              full_name: cols[1],
              email: cols[2] || '',
              pin: cols[3],
              subject: cols[4],
              section: cols[5],
              midterm_grade: cols[6],
              final_grade: cols[7] || 'Pending',
              breakdown: cols[8] || '',
              remarks: cols[9] || 'Passed',
            });
          } else if (!hasEmailCol && hasFinalCol) {
            rowsToUpsert.push({
              ...baseRow,
              student_id: cols[0],
              full_name: cols[1],
              pin: cols[2],
              subject: cols[3],
              section: cols[4],
              midterm_grade: cols[5],
              final_grade: cols[6] || 'Pending',
              breakdown: cols[7] || '',
              remarks: cols[8] || 'Passed',
            });
          } else {
            rowsToUpsert.push({
              ...baseRow,
              student_id: cols[0],
              full_name: cols[1],
              pin: cols[2],
              subject: cols[3],
              section: cols[4],
              midterm_grade: cols[5],
              final_grade: 'Pending',
              breakdown: cols[6] || '',
              remarks: cols[7] || 'Passed',
            });
          }
        }
      }

      setUploadStatus(`Uploading ${rowsToUpsert.length} records under ${currentInstructor.full_name}...`);

      const { error } = await supabase
        .from('student_grades')
        .upsert(rowsToUpsert, { onConflict: 'student_id,subject,section,instructor_id' });

      if (error) {
        setUploadStatus('Upload Error: ' + error.message);
      } else {
        setUploadStatus(`Successfully uploaded/updated ${rowsToUpsert.length} records!`);
        fetchInstructorRecords();
      }
    };
    reader.readAsText(file);
  };

  const computeRemarksFromGrade = (gradeStr, currentRemarks) => {
    const num = parseFloat(gradeStr);
    if (!isNaN(num)) {
      if (num <= 3.0) return 'Passed';
      if (num === 4.0) return 'Conditional';
      if (num > 4.0) return 'Failed';
    }
    return currentRemarks;
  };

  const startEdit = (rec) => {
    setEditingId(rec.id);
    setEditForm({
      email: rec.email || '',
      pin: rec.pin || '',
      midterm_grade: rec.midterm_grade || '',
      final_grade: rec.final_grade || 'Pending',
      breakdown: rec.breakdown || '',
      remarks: rec.remarks || 'Passed',
    });
  };

  const handleSaveEdit = async (id) => {
    setSavingEdit(true);
    const updatedFields = {
      email: editForm.email.trim(),
      pin: editForm.pin.trim(),
      midterm_grade: editForm.midterm_grade.trim(),
      final_grade: editForm.final_grade.trim() || 'Pending',
      breakdown: editForm.breakdown.trim(),
      remarks: editForm.remarks.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('student_grades')
      .update(updatedFields)
      .eq('id', id)
      .eq('instructor_id', currentInstructor.id);

    setSavingEdit(false);

    if (error) {
      alert('Failed to update record: ' + error.message);
    } else {
      setAllRecords((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
      );
      setUploadStatus('Student record updated successfully!');
      setEditingId(null);
    }
  };

  const handleSendSinglePin = async (rec) => {
    setSendingEmailId(rec.id);
    try {
      await sendPinEmail(rec, rec.email);
      setUploadStatus(`PIN sent to ${rec.full_name} (${rec.email})!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Delete this student grade record?')) return;
    await supabase
      .from('student_grades')
      .delete()
      .eq('id', id)
      .eq('instructor_id', currentInstructor.id);
    fetchInstructorRecords();
  };

  const subjects = ['ALL', ...new Set(allRecords.map((r) => r.subject))];
  const sections = ['ALL', ...new Set(allRecords.map((r) => r.section))];

  const filteredRecords = allRecords.filter((r) => {
    const matchSubject = filterSubject === 'ALL' || r.subject === filterSubject;
    const matchSection = filterSection === 'ALL' || r.section === filterSection;
    const matchSearch =
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.email && r.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSubject && matchSection && matchSearch;
  });

  const pendingFacultyCount = facultyList.filter((f) => f.status === 'pending').length;

  const getInitials = (name) => {
    if (!name) return 'IN';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  // ============================================================================
  // SEPARATE PAGE 1: TEACHER & SUPER ADMIN PORTAL (/#/teacher)
  // ============================================================================
  if (isTeacherRoute) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800">
        <header className="bg-slate-900 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
              <div>
                <h1 className="font-bold text-lg leading-tight">Faculty & Admin Portal</h1>
                <p className="text-xs text-slate-400">
                  {currentInstructor
                    ? `Logged in: ${currentInstructor.full_name} (${currentInstructor.department} • ${currentInstructor.role.toUpperCase()})`
                    : 'University Grade Management System'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="#/"
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  setIsTeacherRoute(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Student View
              </a>
              {currentInstructor && (
                <button
                  onClick={() => {
                    setCurrentInstructor(null);
                    setLoginPassword('');
                    setAllRecords([]);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Switch / Lock Account
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {!currentInstructor ? (
            // ================= INSTRUCTOR LOGIN / SAVED CARDS / FORGOT / SIGNUP =================
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setTeacherAuthTab('login');
                    setTeacherAuthError('');
                  }}
                  className={`py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition ${
                    teacherAuthTab === 'login' || teacherAuthTab === 'forgot'
                      ? 'border-indigo-600 text-slate-900 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Instructor Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeacherAuthTab('signup');
                    setTeacherAuthError('');
                    setTeacherAuthSuccess('');
                  }}
                  className={`py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition ${
                    teacherAuthTab === 'signup'
                      ? 'border-indigo-600 text-slate-900 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Request Account
                </button>
              </div>

              <div className="p-6 sm:p-8">
                {teacherAuthError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{teacherAuthError}</span>
                  </div>
                )}

                {teacherAuthSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{teacherAuthSuccess}</span>
                  </div>
                )}

                {/* VIEW 0: SELF-SERVICE FORGOT PASSWORD FLOW */}
                {teacherAuthTab === 'forgot' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherAuthTab('login');
                        setTeacherAuthError('');
                        setTeacherAuthSuccess('');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-4"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                    </button>

                    <h2 className="text-xl font-bold text-slate-900 mb-1">Reset Instructor Password</h2>
                    <p className="text-sm text-slate-500 mb-5">
                      {resetStep === 1
                        ? 'Enter your registered faculty email to receive a 6-digit password reset code.'
                        : 'Enter the 6-digit code sent to your email and create a strong new password.'}
                    </p>

                    {resetStep === 1 ? (
                      <form onSubmit={handleSendPasswordResetCode} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            Registered Instructor Email
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="instructor@unp.edu.ph"
                            value={resetEmailInput}
                            onChange={(e) => setResetEmailInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={sendingResetPin}
                          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition"
                        >
                          <Send className="w-4 h-4" />
                          {sendingResetPin ? 'Sending Verification Code...' : 'Send 6-Digit Reset Code'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleCompletePasswordReset} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            6-Digit Verification Code
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="e.g., 482910"
                            value={resetCodeInput}
                            onChange={(e) => setResetCodeInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showResetNewPass ? 'text' : 'password'}
                              required
                              placeholder="Create strong password"
                              value={resetNewPassword}
                              onChange={(e) => setResetNewPassword(e.target.value)}
                              className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                            <button
                              type="button"
                              onClick={() => setShowResetNewPass(!showResetNewPass)}
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                              title={showResetNewPass ? 'Hide password' : 'Show password'}
                            >
                              {showResetNewPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showResetConfirmPass ? 'text' : 'password'}
                              required
                              placeholder="Re-enter new password"
                              value={resetConfirmPassword}
                              onChange={(e) => setResetConfirmPassword(e.target.value)}
                              className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                            <button
                              type="button"
                              onClick={() => setShowResetConfirmPass(!showResetConfirmPass)}
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                              title={showResetConfirmPass ? 'Hide password' : 'Show password'}
                            >
                              {showResetConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <PasswordStrengthChecklist
                          password={resetNewPassword}
                          confirmPassword={resetConfirmPassword}
                        />

                        <button
                          type="submit"
                          disabled={loadingAuth}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition"
                        >
                          {loadingAuth ? 'Updating Password...' : 'Save New Password'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {teacherAuthTab === 'login' ? (
                  selectedSavedAccount && !selectedSavedAccount.isNewManual ? (
                    // VIEW A: SAVED ACCOUNT SELECTED
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSavedAccount(null);
                          setTeacherAuthError('');
                          setTeacherAuthSuccess('');
                          setGeneratedLoginPin(null);
                          setInstructorPinInput('');
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-4"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Choose another account
                      </button>

                      <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-5">
                        <div className="w-11 h-11 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                          {getInitials(selectedSavedAccount.full_name)}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-slate-900 text-sm truncate">
                            {selectedSavedAccount.full_name}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">{selectedSavedAccount.email}</p>
                          <span className="inline-block mt-0.5 text-[10px] font-bold uppercase px-2 py-0.2 rounded bg-indigo-50 text-indigo-700">
                            {selectedSavedAccount.department} • {selectedSavedAccount.role}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-5">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginMethod('password');
                            setTeacherAuthError('');
                          }}
                          className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            loginMethod === 'password'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Use Password
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginMethod('pin');
                            setTeacherAuthError('');
                          }}
                          className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            loginMethod === 'pin'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email Me a PIN
                        </button>
                      </div>

                      {loginMethod === 'password' ? (
                        <form onSubmit={handleInstructorLogin} className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-semibold uppercase text-slate-600">
                                Instructor Password
                              </label>
                              <button
                                type="button"
                                onClick={() => openForgotPasswordFlow(selectedSavedAccount.email)}
                                className="text-xs font-semibold text-indigo-600 hover:underline"
                              >
                                Forgot password?
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type={showLoginPass ? 'text' : 'password'}
                                required
                                autoFocus
                                placeholder="Enter your password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPass(!showLoginPass)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                title={showLoginPass ? 'Hide password' : 'Show password'}
                              >
                                {showLoginPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={loadingAuth}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition"
                          >
                            {loadingAuth ? 'Signing In...' : 'Sign In with Password'}
                          </button>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          {!generatedLoginPin ? (
                            <div className="text-center py-2">
                              <p className="text-xs text-slate-600 mb-4">
                                We will send a one-time 6-digit login PIN to{' '}
                                <strong className="text-slate-900">{selectedSavedAccount.email}</strong>.
                              </p>
                              <button
                                type="button"
                                onClick={handleSendInstructorLoginPin}
                                disabled={sendingInstructorPin}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition"
                              >
                                <Send className="w-4 h-4" />
                                {sendingInstructorPin ? 'Sending PIN to Email...' : 'Send 6-Digit PIN to My Email'}
                              </button>
                            </div>
                          ) : (
                            <form onSubmit={handleVerifyInstructorPin} className="space-y-4">
                              <div>
                                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                                  Enter 6-Digit Email PIN
                                </label>
                                <input
                                  type="text"
                                  required
                                  autoFocus
                                  maxLength={6}
                                  placeholder="e.g., 482910"
                                  value={instructorPinInput}
                                  onChange={(e) => setInstructorPinInput(e.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={loadingAuth}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition"
                              >
                                {loadingAuth ? 'Verifying PIN...' : 'Verify PIN & Sign In'}
                              </button>
                              <button
                                type="button"
                                onClick={handleSendInstructorLoginPin}
                                disabled={sendingInstructorPin}
                                className="w-full text-xs text-indigo-600 hover:underline font-medium"
                              >
                                {sendingInstructorPin ? 'Resending...' : 'Resend PIN to my email'}
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  ) : savedInstructors.length > 0 && !selectedSavedAccount?.isNewManual ? (
                    // VIEW B: SAVED ACCOUNT CARDS LIST
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome Back</h2>
                      <p className="text-sm text-slate-500 mb-5">
                        Select your saved faculty account to sign in quickly.
                      </p>

                      <div className="space-y-2.5 mb-5">
                        {savedInstructors.map((acc) => (
                          <div
                            key={acc.email}
                            onClick={() => {
                              setSelectedSavedAccount(acc);
                              setLoginMethod('password');
                              setTeacherAuthError('');
                              setTeacherAuthSuccess('');
                            }}
                            className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-10 h-10 rounded-full bg-slate-900 group-hover:bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 transition">
                                {getInitials(acc.full_name)}
                              </div>
                              <div className="overflow-hidden">
                                <h3 className="font-bold text-slate-900 text-sm truncate">{acc.full_name}</h3>
                                <p className="text-xs text-slate-500 truncate">{acc.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => removeSavedInstructor(acc.email, e)}
                                className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                                title="Forget this account on this device"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSavedAccount({ isNewManual: true });
                        }}
                        className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 text-xs font-semibold text-slate-600 hover:text-indigo-700 flex items-center justify-center gap-1.5 transition"
                      >
                        <UserPlus className="w-4 h-4" />
                        Use another instructor account
                      </button>
                    </div>
                  ) : null
                ) : null}

                {/* VIEW C: STANDARD MANUAL EMAIL + PASSWORD LOGIN */}
                {teacherAuthTab === 'login' &&
                  (savedInstructors.length === 0 || selectedSavedAccount?.isNewManual) && (
                    <div>
                      {savedInstructors.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSavedAccount(null);
                            setTeacherAuthError('');
                          }}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-4"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back to saved accounts
                        </button>
                      )}
                      <h2 className="text-xl font-bold text-slate-900 mb-1">Faculty Sign In</h2>
                      <p className="text-sm text-slate-500 mb-6">
                        Log in with your approved instructor email and password.
                      </p>
                      <form
                        onSubmit={(e) => {
                          setSelectedSavedAccount(null);
                          handleInstructorLogin(e);
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            Instructor Email
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="instructor@unp.edu.ph"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold uppercase text-slate-600">
                              Password
                            </label>
                            <button
                              type="button"
                              onClick={() => openForgotPasswordFlow(loginEmail)}
                              className="text-xs font-semibold text-indigo-600 hover:underline"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showLoginPass ? 'text' : 'password'}
                              required
                              placeholder="Enter password"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPass(!showLoginPass)}
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                              title={showLoginPass ? 'Hide password' : 'Show password'}
                            >
                              {showLoginPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={loadingAuth}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition"
                        >
                          {loadingAuth ? 'Signing In...' : 'Sign In to Dashboard'}
                        </button>
                      </form>
                    </div>
                  )}

                {/* VIEW D: REQUEST NEW INSTRUCTOR ACCOUNT */}
                {teacherAuthTab === 'signup' && (
                  <>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Request Instructor Account</h2>
                    <p className="text-sm text-slate-500 mb-6">
                      Submit your details below. The Super Admin must approve your account before you can upload grades.
                    </p>
                    <form onSubmit={handleInstructorSignup} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                          Full Name (Displayed to Students)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., JUAN DELA CRUZ"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                          College / Department
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., CCIT"
                          value={signupDept}
                          onChange={(e) => setSignupDept(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="your.email@unp.edu.ph"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                          Create Strong Password
                        </label>
                        <div className="relative">
                          <input
                            type={showSignupPass ? 'text' : 'password'}
                            required
                            placeholder="Enter strong password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPass(!showSignupPass)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            title={showSignupPass ? 'Hide password' : 'Show password'}
                          >
                            {showSignupPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showSignupConfirmPass ? 'text' : 'password'}
                            required
                            placeholder="Re-enter your password"
                            value={signupConfirmPassword}
                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupConfirmPass(!showSignupConfirmPass)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            title={showSignupConfirmPass ? 'Hide password' : 'Show password'}
                          >
                            {showSignupConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <PasswordStrengthChecklist
                        password={signupPassword}
                        confirmPassword={signupConfirmPassword}
                      />

                      <button
                        type="submit"
                        disabled={
                          loadingAuth ||
                          !evaluatePasswordStrength(signupPassword).isValid ||
                          signupPassword !== signupConfirmPassword
                        }
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition"
                      >
                        {loadingAuth ? 'Submitting Request...' : 'Submit Account Request'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ) : (
            // ================= LOGGED-IN INSTRUCTOR / SUPER ADMIN DASHBOARD =================
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4">
                <button
                  onClick={() => setTeacherViewTab('grades')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
                    teacherViewTab === 'grades'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  My Class Records ({allRecords.length})
                </button>

                {currentInstructor.role === 'admin' && (
                  <button
                    onClick={() => {
                      setTeacherViewTab('faculty');
                      fetchFacultyList();
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
                      teacherViewTab === 'faculty'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Faculty Account Approvals
                    {pendingFacultyCount > 0 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-400 text-slate-950 font-extrabold">
                        {pendingFacultyCount} Pending
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setTeacherViewTab('profile');
                    setProfileName(currentInstructor.full_name || '');
                    setProfileDept(currentInstructor.department || 'CCIT');
                    setProfileEmail(currentInstructor.email || '');
                    setShowProfileVerify(false);
                    setShowCurrentPass(false);
                    setShowNewPass(false);
                    setShowConfirmPass(false);
                    setProfileStatusMsg({ type: '', text: '' });
                    setProfileVerifyMsg({ type: '', text: '' });
                    setPasswordStatusMsg({ type: '', text: '' });
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
                    teacherViewTab === 'profile'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Account & Password Settings
                </button>
              </div>

              {teacherViewTab === 'profile' ? (
                // ================= TAB 3: INSTRUCTOR PROFILE & PASSWORD SETTINGS =================
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Card 1: Profile Details (Stays Fixed; Opens Centered Modal on Submit) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center gap-2.5 mb-1">
                        <UserCheck className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-bold text-slate-900">Instructor Profile</h2>
                      </div>
                      <p className="text-xs text-slate-500 mb-5">
                        For your security, any change to your profile or login email opens a verification modal requiring your password or a 6-digit email PIN.
                      </p>

                      {profileStatusMsg.text && (
                        <div
                          className={`mb-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                            profileStatusMsg.type === 'error'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {profileStatusMsg.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          )}
                          <span>{profileStatusMsg.text}</span>
                        </div>
                      )}

                      <form onSubmit={handleInitiateProfileSave} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            Full Name (Displayed on Student Cards)
                          </label>
                          <input
                            type="text"
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            College / Department
                          </label>
                          <input
                            type="text"
                            required
                            value={profileDept}
                            onChange={(e) => setProfileDept(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            Login Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                        >
                          Save Profile Changes
                        </button>
                      </form>
                    </div>

                    {/* Card 2: Change Password (Blocks Reusing Current Password + 3 Independent Eye Toggles) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center gap-2.5 mb-1">
                        <KeyRound className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
                      </div>
                      <p className="text-xs text-slate-500 mb-5">
                        Update your instructor portal password. Your new password must be different from your current password.
                      </p>

                      {passwordStatusMsg.text && (
                        <div
                          className={`mb-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                            passwordStatusMsg.type === 'error'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {passwordStatusMsg.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          )}
                          {passwordStatusMsg.text}
                        </div>
                      )}

                      <form onSubmit={handleUpdateInstructorPassword} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPass ? 'text' : 'password'}
                              required
                              placeholder="Enter current password"
                              value={currentPassInput}
                              onChange={(e) => setCurrentPassInput(e.target.value)}
                              className="w-full px-3.5 py-2 pr-10 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                              title={showCurrentPass ? 'Hide current password' : 'Show current password'}
                            >
                              {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            New Strong Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPass ? 'text' : 'password'}
                              required
                              placeholder="Enter new strong password"
                              value={newPassInput}
                              onChange={(e) => setNewPassInput(e.target.value)}
                              className="w-full px-3.5 py-2 pr-10 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                              title={showNewPass ? 'Hide new password' : 'Show new password'}
                            >
                              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPass ? 'text' : 'password'}
                              required
                              placeholder="Re-enter new password"
                              value={confirmPassInput}
                              onChange={(e) => setConfirmPassInput(e.target.value)}
                              className="w-full px-3.5 py-2 pr-10 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPass(!showConfirmPass)}
                              className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                              title={showConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
                            >
                              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <PasswordStrengthChecklist
                          password={newPassInput}
                          confirmPassword={confirmPassInput}
                          currentPassword={currentPassInput || currentInstructor.password}
                        />

                        <button
                          type="submit"
                          disabled={
                            savingPassword ||
                            !evaluatePasswordStrength(newPassInput).isValid ||
                            newPassInput !== confirmPassInput ||
                            newPassInput === currentPassInput ||
                            newPassInput === currentInstructor.password
                          }
                          className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition"
                        >
                          {savingPassword ? 'Updating Password...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* CENTERED MODAL OVERLAY FOR PROFILE IDENTITY VERIFICATION */}
                  {showProfileVerify && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                      onClick={() => {
                        setShowProfileVerify(false);
                        setProfileVerifyMsg({ type: '', text: '' });
                      }}
                    >
                      <div
                        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                            <div>
                              <h3 className="font-bold text-sm leading-tight">
                                Verify Identity to Save Changes
                              </h3>
                              <p className="text-[11px] text-slate-400">
                                Confirm with your password or a 6-digit email PIN
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowProfileVerify(false);
                              setProfileVerifyMsg({ type: '', text: '' });
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Close modal (Esc)"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-6 space-y-4">
                          {profileVerifyMsg.text && (
                            <div
                              className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
                                profileVerifyMsg.type === 'error'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {profileVerifyMsg.type === 'error' ? (
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                              )}
                              <span>{profileVerifyMsg.text}</span>
                            </div>
                          )}

                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Pending Profile Update
                            </span>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-500">Full Name:</span>
                              <strong className="text-slate-900 truncate">
                                {profileName.trim().toUpperCase()}
                              </strong>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-500">Department:</span>
                              <strong className="text-slate-900">
                                {profileDept.trim() || 'CCIT'}
                              </strong>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-500">Login Email:</span>
                              <strong className="font-mono text-indigo-700 truncate">
                                {profileEmail.trim().toLowerCase()}
                              </strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileVerifyMethod('password');
                                setProfileVerifyMsg({ type: '', text: '' });
                              }}
                              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                                profileVerifyMethod === 'password'
                                  ? 'bg-white text-slate-900 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Use Password
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProfileVerifyMethod('pin');
                                setProfileVerifyMsg({ type: '', text: '' });
                              }}
                              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                                profileVerifyMethod === 'pin'
                                  ? 'bg-white text-slate-900 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Email Me a PIN
                            </button>
                          </div>

                          {profileVerifyMethod === 'password' ? (
                            <form onSubmit={handleConfirmAndSaveProfile} className="space-y-4">
                              <div>
                                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                                  Enter Current Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={showProfileVerifyPass ? 'text' : 'password'}
                                    required
                                    autoFocus
                                    placeholder="Enter your current password"
                                    value={profileVerifyPassword}
                                    onChange={(e) => setProfileVerifyPassword(e.target.value)}
                                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowProfileVerifyPass(!showProfileVerifyPass)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                    title={showProfileVerifyPass ? 'Hide password' : 'Show password'}
                                  >
                                    {showProfileVerifyPass ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowProfileVerify(false);
                                    setProfileVerifyMsg({ type: '', text: '' });
                                  }}
                                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={savingProfile}
                                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                                >
                                  {savingProfile ? 'Verifying & Saving...' : 'Confirm & Save Changes'}
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="space-y-4">
                              {!profileGeneratedPin ? (
                                <div className="text-center py-2">
                                  <p className="text-xs text-slate-600 mb-4">
                                    We will send a 6-digit confirmation PIN to your registered email:{' '}
                                    <strong className="text-slate-900">{currentInstructor.email}</strong>
                                  </p>
                                  <button
                                    type="button"
                                    onClick={handleSendProfileVerifyPin}
                                    disabled={sendingProfilePin}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                                  >
                                    <Send className="w-4 h-4" />
                                    {sendingProfilePin ? 'Sending 6-Digit PIN...' : 'Send 6-Digit PIN to My Email'}
                                  </button>
                                </div>
                              ) : (
                                <form onSubmit={handleConfirmAndSaveProfile} className="space-y-4">
                                  <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                                      Enter 6-Digit Email PIN
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      autoFocus
                                      maxLength={6}
                                      placeholder="e.g., 482910"
                                      value={profileVerifyPinInput}
                                      onChange={(e) => setProfileVerifyPinInput(e.target.value)}
                                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    />
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={handleSendProfileVerifyPin}
                                      disabled={sendingProfilePin}
                                      className="text-xs text-indigo-600 hover:underline font-semibold"
                                    >
                                      {sendingProfilePin ? 'Resending...' : 'Resend PIN'}
                                    </button>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowProfileVerify(false);
                                          setProfileVerifyMsg({ type: '', text: '' });
                                        }}
                                        className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={savingProfile}
                                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                                      >
                                        {savingProfile ? 'Verifying & Saving...' : 'Verify PIN & Save'}
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : teacherViewTab === 'faculty' && currentInstructor.role === 'admin' ? (
                // ================= TAB 2: SUPER ADMIN FACULTY APPROVAL & PASSWORD RESET MODAL =================
                <>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-bold text-slate-900">Instructor Account Requests & Directory</h2>
                      <p className="text-sm text-slate-500">
                        Approve faculty requests, or reset an instructor's password if they get locked out.
                      </p>
                    </div>

                    {facultyActionBanner && (
                      <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{facultyActionBanner}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFacultyActionBanner('')}
                          className="text-xs text-emerald-600 hover:text-emerald-900"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
                            <th className="py-3 px-3">Instructor Name</th>
                            <th className="py-3 px-3">Department</th>
                            <th className="py-3 px-3">Email</th>
                            <th className="py-3 px-3">Role</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {facultyList.map((fac) => (
                            <tr key={fac.id} className="hover:bg-slate-50">
                              <td className="py-3 px-3 font-semibold text-slate-900">{fac.full_name}</td>
                              <td className="py-3 px-3">{fac.department}</td>
                              <td className="py-3 px-3 font-mono text-xs text-slate-600">{fac.email}</td>
                              <td className="py-3 px-3 uppercase text-xs font-bold text-indigo-700">{fac.role}</td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    fac.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : fac.status === 'pending'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}
                                >
                                  {fac.status === 'pending' && <Clock className="w-3 h-3" />}
                                  {fac.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  onClick={() => {
                                    setAdminResetFaculty(fac);
                                    setAdminNewPass('');
                                    setAdminConfirmPass('');
                                    setShowAdminResetPass(false);
                                    setShowAdminResetConfirmPass(false);
                                    setAdminResetMsg({ type: '', text: '' });
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition"
                                  title="Open password override modal for this instructor"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Reset Pass
                                </button>
                                {fac.role !== 'admin' && (
                                  <>
                                    {fac.status !== 'approved' && (
                                      <button
                                        onClick={() => handleUpdateFacultyStatus(fac.id, 'approved')}
                                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                                      >
                                        Approve
                                      </button>
                                    )}
                                    {fac.status !== 'rejected' && (
                                      <button
                                        onClick={() => handleUpdateFacultyStatus(fac.id, 'rejected')}
                                        className="px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold transition"
                                      >
                                        Reject / Suspend
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteFaculty(fac)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition align-middle"
                                      title="Delete Instructor"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CENTERED MODAL OVERLAY FOR SUPER ADMIN PASSWORD OVERRIDE */}
                  {adminResetFaculty && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                      onClick={() => {
                        setAdminResetFaculty(null);
                        setAdminNewPass('');
                        setAdminConfirmPass('');
                        setAdminResetMsg({ type: '', text: '' });
                      }}
                    >
                      <div
                        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <KeyRound className="w-5 h-5 text-amber-400 shrink-0" />
                            <div>
                              <h3 className="font-bold text-sm leading-tight">
                                Super Admin Password Override
                              </h3>
                              <p className="text-[11px] text-slate-400">
                                Set a new strong password for this instructor
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminResetFaculty(null);
                              setAdminNewPass('');
                              setAdminConfirmPass('');
                              setAdminResetMsg({ type: '', text: '' });
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Close modal (Esc)"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                          {/* Target Instructor Summary Banner */}
                          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {getInitials(adminResetFaculty.full_name)}
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="font-bold text-slate-900 text-sm truncate">
                                {adminResetFaculty.full_name}
                              </h4>
                              <p className="text-xs text-slate-500 font-mono truncate">
                                {adminResetFaculty.email}
                              </p>
                              <span className="inline-block mt-0.5 text-[10px] font-bold uppercase px-2 py-0.2 rounded bg-indigo-50 text-indigo-700">
                                {adminResetFaculty.department} • {adminResetFaculty.role}
                              </span>
                            </div>
                          </div>

                          {adminResetMsg.text && (
                            <div
                              className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
                                adminResetMsg.type === 'error'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {adminResetMsg.type === 'error' ? (
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                              )}
                              <span>{adminResetMsg.text}</span>
                            </div>
                          )}

                          <form onSubmit={handleAdminResetFacultyPassword} className="space-y-4">
                            {/* Box 1: New Strong Password + Independent Eye Toggle */}
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                                New Strong Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showAdminResetPass ? 'text' : 'password'}
                                  required
                                  autoFocus
                                  placeholder="Enter new strong password"
                                  value={adminNewPass}
                                  onChange={(e) => setAdminNewPass(e.target.value)}
                                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowAdminResetPass(!showAdminResetPass)}
                                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                  title={showAdminResetPass ? 'Hide new password' : 'Show new password'}
                                >
                                  {showAdminResetPass ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Box 2: Confirm New Password + Independent Eye Toggle */}
                            <div>
                              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                                Confirm New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showAdminResetConfirmPass ? 'text' : 'password'}
                                  required
                                  placeholder="Re-enter new password"
                                  value={adminConfirmPass}
                                  onChange={(e) => setAdminConfirmPass(e.target.value)}
                                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowAdminResetConfirmPass(!showAdminResetConfirmPass)
                                  }
                                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                  title={
                                    showAdminResetConfirmPass
                                      ? 'Hide confirm password'
                                      : 'Show confirm password'
                                  }
                                >
                                  {showAdminResetConfirmPass ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Live Password Strength & Reuse Checklist */}
                            <PasswordStrengthChecklist
                              password={adminNewPass}
                              confirmPassword={adminConfirmPass}
                              currentPassword={adminResetFaculty.password}
                            />

                            {/* Modal Footer Actions */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminResetFaculty(null);
                                  setAdminNewPass('');
                                  setAdminConfirmPass('');
                                  setAdminResetMsg({ type: '', text: '' });
                                }}
                                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={
                                  savingAdminReset ||
                                  !evaluatePasswordStrength(adminNewPass).isValid ||
                                  adminNewPass !== adminConfirmPass ||
                                  adminNewPass === adminResetFaculty.password
                                }
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition"
                              >
                                {savingAdminReset ? 'Saving Password...' : 'Save New Password'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // ================= TAB 1: INSTRUCTOR CLASS RECORDS =================
                <>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          Bulk CSV Upload — {currentInstructor.full_name}
                        </h2>
                        <p className="text-sm text-slate-500">
                          Uploaded students are linked exclusively to your instructor account.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={downloadTemplate}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-medium"
                        >
                          <Download className="w-4 h-4" /> Download CSV Template
                        </button>
                        <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium cursor-pointer">
                          <Upload className="w-4 h-4" /> Upload CSV File
                          <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                    {uploadStatus && (
                      <div className="mt-4 p-3 rounded-lg bg-indigo-50 text-indigo-900 text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          {uploadStatus}
                        </div>
                        <button
                          onClick={() => setUploadStatus('')}
                          className="text-xs text-indigo-500 hover:text-indigo-800"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="Search your students by Name, ID, or Gmail..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm"
                        />
                      </div>
                      <div className="flex gap-3">
                        <select
                          value={filterSubject}
                          onChange={(e) => setFilterSubject(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                        >
                          {subjects.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub === 'ALL' ? 'All My Subjects' : sub}
                            </option>
                          ))}
                        </select>
                        <select
                          value={filterSection}
                          onChange={(e) => setFilterSection(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                        >
                          {sections.map((sec) => (
                            <option key={sec} value={sec}>
                              {sec === 'ALL' ? 'All My Sections' : sec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
                            <th className="py-3 px-3">Student ID</th>
                            <th className="py-3 px-3">Full Name</th>
                            <th className="py-3 px-3">Registered Gmail</th>
                            <th className="py-3 px-3">PIN</th>
                            <th className="py-3 px-3">Subject</th>
                            <th className="py-3 px-3">Section</th>
                            <th className="py-3 px-3">Midterm</th>
                            <th className="py-3 px-3">Final</th>
                            <th className="py-3 px-3">Breakdown</th>
                            <th className="py-3 px-3">Remarks</th>
                            <th className="py-3 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {loadingTeacher ? (
                            <tr>
                              <td colSpan="11" className="py-8 text-center text-slate-400">
                                Loading your class records...
                              </td>
                            </tr>
                          ) : filteredRecords.length === 0 ? (
                            <tr>
                              <td colSpan="11" className="py-8 text-center text-slate-400">
                                No student records found under your account. Upload a CSV file to get started.
                              </td>
                            </tr>
                          ) : (
                            filteredRecords.map((rec) => {
                              const isEditing = editingId === rec.id;
                              return (
                                <tr key={rec.id} className={isEditing ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}>
                                  <td className="py-3 px-3 font-mono text-xs">{rec.student_id}</td>
                                  <td className="py-3 px-3 font-medium text-slate-900">{rec.full_name}</td>

                                  <td className="py-3 px-3 text-xs text-slate-600">
                                    {isEditing ? (
                                      <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        placeholder="Clear to reset Gmail"
                                        className="w-44 px-2 py-1 rounded border border-indigo-300 bg-white text-xs"
                                      />
                                    ) : rec.email ? (
                                      <span className="text-emerald-700 font-medium">{rec.email}</span>
                                    ) : (
                                      <span className="text-slate-400 italic">Not registered yet</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3 font-mono text-xs text-slate-500">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={editForm.pin}
                                        onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })}
                                        className="w-16 px-2 py-1 rounded border border-indigo-300 bg-white font-mono text-xs"
                                      />
                                    ) : (
                                      rec.pin
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-xs">{rec.subject}</td>
                                  <td className="py-3 px-3">{rec.section}</td>

                                  <td className="py-3 px-3 font-bold text-indigo-700">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={editForm.midterm_grade}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditForm({
                                            ...editForm,
                                            midterm_grade: val,
                                            remarks: computeRemarksFromGrade(val, editForm.remarks),
                                          });
                                        }}
                                        className="w-16 px-2 py-1 rounded border border-indigo-400 bg-white font-bold text-indigo-900"
                                      />
                                    ) : (
                                      rec.midterm_grade
                                    )}
                                  </td>

                                  <td className="py-3 px-3 font-bold text-indigo-950">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={editForm.final_grade}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditForm({
                                            ...editForm,
                                            final_grade: val,
                                            remarks: computeRemarksFromGrade(val, editForm.remarks),
                                          });
                                        }}
                                        placeholder="Pending"
                                        className="w-20 px-2 py-1 rounded border border-indigo-400 bg-white font-bold text-indigo-950"
                                      />
                                    ) : (
                                      <span className={rec.final_grade === 'Pending' || !rec.final_grade ? 'text-slate-400 font-normal text-xs' : 'font-bold text-indigo-950'}>
                                        {rec.final_grade || 'Pending'}
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-xs text-slate-500 max-w-xs">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={editForm.breakdown}
                                        onChange={(e) => setEditForm({ ...editForm, breakdown: e.target.value })}
                                        className="w-full min-w-[160px] px-2 py-1 rounded border border-indigo-300 bg-white text-xs text-slate-700"
                                      />
                                    ) : (
                                      <span className="line-clamp-1" title={rec.breakdown}>
                                        {rec.breakdown || '—'}
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3">
                                    {isEditing ? (
                                      <select
                                        value={editForm.remarks}
                                        onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                                        className="px-2 py-1 rounded border border-indigo-300 bg-white text-xs font-medium"
                                      >
                                        <option value="Passed">Passed</option>
                                        <option value="Conditional">Conditional</option>
                                        <option value="INC">INC</option>
                                        <option value="Failed">Failed</option>
                                      </select>
                                    ) : (
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                          rec.remarks === 'Passed'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : rec.remarks === 'Conditional' || rec.remarks === 'INC'
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-red-50 text-red-700'
                                        }`}
                                      >
                                        {rec.remarks}
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-right whitespace-nowrap">
                                    {isEditing ? (
                                      <div className="inline-flex items-center gap-1">
                                        <button
                                          onClick={() => handleSaveEdit(rec.id)}
                                          disabled={savingEdit}
                                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                          title="Save Changes"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setEditingId(null)}
                                          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                                          title="Cancel"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="inline-flex items-center gap-1">
                                        <button
                                          onClick={() => handleSendSinglePin(rec)}
                                          disabled={sendingEmailId === rec.id || !rec.email}
                                          className={`p-1.5 rounded-lg transition ${
                                            rec.email
                                              ? 'text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50'
                                              : 'text-slate-300 cursor-not-allowed'
                                          }`}
                                          title={rec.email ? `Resend PIN to ${rec.email}` : 'Student has not registered a Gmail yet'}
                                        >
                                          <Mail className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => startEdit(rec)}
                                          className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-1.5 rounded-lg transition"
                                          title="Edit Grades or Reset Student Gmail"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteRecord(rec.id)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                                          title="Delete Record"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ============================================================================
  // SEPARATE PAGE 2: STUDENT PORTAL (Default Page at /)
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-indigo-950 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="font-bold text-lg leading-tight">University Grade Portal</h1>
              <p className="text-xs text-indigo-200">Official Student Grade Inquiry</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!studentRecords ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setStudentTab('login');
                  setStudentError('');
                }}
                className={`py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition ${
                  studentTab === 'login'
                    ? 'border-indigo-600 text-indigo-900 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                1. View Grades
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudentTab('register');
                  setStudentError('');
                  setStudentSuccess('');
                }}
                className={`py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition ${
                  studentTab === 'register'
                    ? 'border-indigo-600 text-indigo-900 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Mail className="w-4 h-4" />
                2. Register Gmail / PIN
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {studentError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{studentError}</span>
                </div>
              )}

              {studentSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{studentSuccess}</span>
                </div>
              )}

              {studentTab === 'login' ? (
                <>
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xl mb-1">
                    <Lock className="w-5 h-5 text-indigo-600" />
                    Student Grade Login
                  </div>
                  <p className="text-sm text-slate-500 mb-6">
                    Enter your Student ID and the PIN sent to your Gmail.
                  </p>

                  <form onSubmit={handleStudentLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                        Student ID Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 26-20437"
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                        Secret PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? 'text' : 'password'}
                          required
                          placeholder="Enter your 4-digit PIN"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingStudent}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition"
                    >
                      {loadingStudent ? 'Checking Records...' : 'View My Grades'}
                    </button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setRegStudentId(studentIdInput);
                        setStudentTab('register');
                        setStudentError('');
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      First time here? Register your Gmail to get your PIN →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xl mb-1">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    Register Your Gmail
                  </div>
                  <p className="text-sm text-slate-500 mb-6">
                    Enter your Student ID and personal Gmail address. Your secret PIN will be emailed to you immediately.
                  </p>

                  <form onSubmit={handleStudentRegisterGmail} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                        Your Student ID Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 26-20437"
                        value={regStudentId}
                        onChange={(e) => setRegStudentId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                        Your Personal Gmail Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={regGmail}
                        onChange={(e) => setRegGmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingStudentPin}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition"
                    >
                      <Send className="w-4 h-4" />
                      {sendingStudentPin ? 'Saving Gmail & Sending PIN...' : 'Register Gmail & Email My PIN'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Official Academic Record
                </span>
                <h2 className="text-2xl font-bold text-slate-900">{studentRecords[0].full_name}</h2>
                <p className="text-sm text-slate-500">
                  Student ID: {studentRecords[0].student_id}
                  {studentRecords[0].email ? ` • ${studentRecords[0].email}` : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setStudentRecords(null);
                  setStudentIdInput('');
                  setPinInput('');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {studentRecords.map((rec) => (
                <div key={rec.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-1">
                        {rec.section}
                      </span>
                      <h3 className="font-bold text-lg text-slate-900">{rec.subject}</h3>
                      {rec.instructor_name && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Instructor: <strong className="text-slate-700">{rec.instructor_name}</strong>
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        rec.remarks === 'Passed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : rec.remarks === 'Conditional' || rec.remarks === 'INC'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {rec.remarks}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                      <span className="block text-xs font-medium text-slate-500 mb-1">Midterm Grade</span>
                      <span className="text-2xl font-extrabold text-indigo-950">{rec.midterm_grade}</span>
                    </div>
                    <div className="bg-indigo-50/50 rounded-xl p-3.5 border border-indigo-100">
                      <span className="block text-xs font-medium text-indigo-600 mb-1">Final Grade</span>
                      <span className="text-2xl font-extrabold text-indigo-900">
                        {rec.final_grade || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {rec.breakdown && (
                    <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <strong>Breakdown:</strong> {rec.breakdown}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}