import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  GraduationCap, ShieldCheck, Upload, Download, Search, 
  LogOut, Eye, EyeOff, Trash2, CheckCircle2, AlertCircle, 
  Lock, Pencil, Check, X, Mail, Send, UserCheck, KeyRound, 
  ArrowLeft, UserPlus, Users, BookOpen, Clock, ShieldAlert
} from 'lucide-react';

// Initialize Supabase Client from your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// EmailJS Credentials from .env
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const checkIsTeacherRoute = () => {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path.startsWith('/teacher') || path.startsWith('/admin') || hash.startsWith('#/teacher') || hash.startsWith('#/admin');
};

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
  const [teacherAuthTab, setTeacherAuthTab] = useState('login'); // 'login' | 'signup'
  const [currentInstructor, setCurrentInstructor] = useState(null); // Logged-in instructor object
  const [teacherViewTab, setTeacherViewTab] = useState('grades'); // 'grades' | 'faculty' (admin only)

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [teacherAuthError, setTeacherAuthError] = useState('');
  const [teacherAuthSuccess, setTeacherAuthSuccess] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Instructor Signup Form
  const [signupName, setSignupName] = useState('');
  const [signupDept, setSignupDept] = useState('CCIT');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

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

  // HELPER: Send PIN Email via EmailJS REST API
  const sendPinEmail = async (record, targetEmail) => {
    const emailToUse = (targetEmail || record.email || '').trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      throw new Error(`Please provide a valid Gmail address.`);
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
          subject: `${record.subject} (${record.instructor_name || 'Instructor'})`,
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
  const handleInstructorLogin = async (e) => {
    e.preventDefault();
    setTeacherAuthError('');
    setTeacherAuthSuccess('');
    setLoadingAuth(true);

    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('email', loginEmail.trim().toLowerCase())
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

    setCurrentInstructor(data);
    fetchInstructorRecords(data);
    if (data.role === 'admin') {
      fetchFacultyList();
    }
  };

  const handleInstructorSignup = async (e) => {
    e.preventDefault();
    setTeacherAuthError('');
    setTeacherAuthSuccess('');
    setLoadingAuth(true);

    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanName = signupName.trim().toUpperCase();

    const { error } = await supabase.from('instructors').insert([
      {
        full_name: cleanName,
        department: signupDept.trim() || 'CCIT',
        email: cleanEmail,
        password: signupPassword.trim(),
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
    setTeacherAuthTab('login');
  };

  // Fetch only the logged-in instructor's student records
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

  // Super Admin: Fetch all instructors for approval management
  const fetchFacultyList = async () => {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFacultyList(data);
    }
  };

  // Super Admin: Approve or Reject an Instructor
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

  // 3. DOWNLOAD CSV TEMPLATE
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

  // 4. BULK CSV UPLOAD TO SUPABASE (Automatically attaches currentInstructor.id & full_name)
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

  // 5. START EDITING A STUDENT RECORD
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

  // 6. SAVE EDITED GRADE & GMAIL TO SUPABASE
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

  // 7. TEACHER: RESEND PIN TO ONE STUDENT
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

  // 8. DELETE RECORD
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
                    ? `Logged in: ${currentInstructor.full_name} (${currentInstructor.role.toUpperCase()})`
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
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {!currentInstructor ? (
            // ================= INSTRUCTOR LOGIN / SIGNUP CARD =================
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
              <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setTeacherAuthTab('login');
                    setTeacherAuthError('');
                  }}
                  className={`py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition ${
                    teacherAuthTab === 'login'
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

                {teacherAuthTab === 'login' ? (
                  <>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Faculty Sign In</h2>
                    <p className="text-sm text-slate-500 mb-6">
                      Log in with your approved instructor email and password.
                    </p>
                    <form onSubmit={handleInstructorLogin} className="space-y-4">
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
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Enter password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loadingAuth}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition"
                      >
                        {loadingAuth ? 'Signing In...' : 'Sign In to Dashboard'}
                      </button>
                    </form>
                  </>
                ) : (
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
                          Create Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Create a strong password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loadingAuth}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition"
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
              {/* Super Admin Navigation Bar (Switch between My Class Grades & Faculty Approvals) */}
              {currentInstructor.role === 'admin' && (
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
                </div>
              )}

              {teacherViewTab === 'faculty' && currentInstructor.role === 'admin' ? (
                // ================= SUPER ADMIN: FACULTY APPROVAL TABLE =================
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Instructor Account Requests & Directory</h2>
                    <p className="text-sm text-slate-500">
                      Approve or revoke faculty access. Each approved instructor can only view and manage their own uploaded students.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
                          <th className="py-3 px-3">Instructor Name</th>
                          <th className="py-3 px-3">Department</th>
                          <th className="py-3 px-3">Email</th>
                          <th className="py-3 px-3">Role</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Approval Actions</th>
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
                            <td className="py-3 px-3 text-right whitespace-nowrap space-x-2">
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
              ) : (
                // ================= INSTRUCTOR'S ISOLATED CLASS RECORDS VIEW =================
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

                  {/* Master List & Filters */}
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
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
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

                  {/* {rec.breakdown && (
                    <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <strong>Breakdown:</strong> {rec.breakdown}
                    </p>
                  )} */}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}