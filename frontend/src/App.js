import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Axios configuration with auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication check component
const RequireAuth = ({ children }) => {
  const isAuthenticated = localStorage.getItem("token") !== null;
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Login page
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);
    
    try {
      const response = await axios.post(`${API}/token`, formData);
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("teacherId", response.data.teacher_id);
      localStorage.setItem("teacherName", response.data.name);
      navigate("/dashboard");
    } catch (err) {
      setError("خطأ في البريد الإلكتروني أو كلمة المرور");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">تسجيل الدخول</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-right">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-right mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-right mb-2">كلمة المرور</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            دخول
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p>
            ليس لديك حساب؟{" "}
            <Link to="/register" className="text-blue-500 hover:underline">
              تسجيل جديد
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Register page
const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await axios.post(`${API}/register`, {
        name,
        email,
        password,
      });
      
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("teacherId", response.data.teacher_id);
      localStorage.setItem("teacherName", response.data.name);
      navigate("/dashboard");
    } catch (err) {
      setError("البريد الإلكتروني مسجل بالفعل أو هناك خطأ في البيانات");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">تسجيل حساب جديد</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-right">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-right mb-2">الاسم</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-right mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-right mb-2">كلمة المرور</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            تسجيل
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p>
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Navigation component
const Navigation = () => {
  const navigate = useNavigate();
  const teacherName = localStorage.getItem("teacherName");
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("teacherId");
    localStorage.removeItem("teacherName");
    navigate("/login");
  };
  
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <button onClick={handleLogout} className="hover:text-blue-200">تسجيل الخروج</button>
        </div>
        <div className="flex items-center space-x-4">
          <span>مرحباً {teacherName}</span>
          <Link to="/dashboard" className="font-bold text-xl">نظام تقييم المشاركة</Link>
        </div>
      </div>
    </nav>
  );
};

// Dashboard page
const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchClasses();
  }, []);
  
  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API}/classes`);
      setClasses(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };
  
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    
    try {
      await axios.post(`${API}/classes`, { name: newClassName });
      setNewClassName("");
      fetchClasses();
    } catch (err) {
      console.error(err);
      alert("خطأ في إنشاء الفصل");
    }
  };
  
  const handleDeleteClass = async (classId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الفصل؟ سيتم حذف جميع الطلاب والتقييمات المرتبطة به.")) {
      return;
    }
    
    try {
      await axios.delete(`${API}/classes/${classId}`);
      fetchClasses();
    } catch (err) {
      console.error(err);
      alert("خطأ في حذف الفصل");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">الفصول الدراسية</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-right">إضافة فصل جديد</h2>
          <form onSubmit={handleCreateClass} className="flex space-x-4 mb-4">
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              إضافة
            </button>
            <input
              type="text"
              placeholder="اسم الفصل"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-right"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              required
            />
          </form>
        </div>
        
        {loading ? (
          <div className="text-center">جاري التحميل...</div>
        ) : classes.length === 0 ? (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-xl text-gray-600">لم تقم بإنشاء أي فصول بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-right">{classItem.name}</h3>
                  <p className="text-gray-500 text-right mb-4">
                    تم الإنشاء: {new Date(classItem.created_at).toLocaleDateString("ar-SA")}
                  </p>
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      حذف الفصل
                    </button>
                    <button
                      onClick={() => navigate(`/classes/${classItem.id}`)}
                      className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    >
                      إدارة الفصل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Class management page
const ClassManagement = () => {
  const { classId } = useParams();
  const [classDetails, setClassDetails] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({ name: "", student_number: "" });
  const [fileContent, setFileContent] = useState("");
  const [uploadMode, setUploadMode] = useState("manual");
  const [statistics, setStatistics] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchClassDetails();
    fetchStudents();
    fetchStatistics();
  }, [classId]);
  
  const fetchClassDetails = async () => {
    try {
      const response = await axios.get(`${API}/classes/${classId}`);
      setClassDetails(response.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/classes/${classId}/students`);
      setStudents(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };
  
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API}/classes/${classId}/statistics`);
      setStatistics(response.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.student_number.trim()) return;
    
    try {
      await axios.post(`${API}/classes/${classId}/students`, newStudent);
      setNewStudent({ name: "", student_number: "" });
      fetchStudents();
      fetchStatistics();
    } catch (err) {
      console.error(err);
      alert("خطأ في إضافة الطالب");
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result);
    };
    reader.readAsText(file);
  };
  
  const handleUploadStudents = async () => {
    if (!fileContent) {
      alert("يرجى اختيار ملف أولاً");
      return;
    }
    
    try {
      await axios.post(`${API}/classes/${classId}/students/upload`, {
        content: fileContent
      });
      setFileContent("");
      document.getElementById("file-upload").value = "";
      fetchStudents();
      fetchStatistics();
      alert("تم استيراد الطلاب بنجاح");
    } catch (err) {
      console.error(err);
      alert("خطأ في استيراد الطلاب. تأكد من تنسيق الملف");
    }
  };
  
  const handleDeleteAllStudents = async () => {
    if (!window.confirm("هل أنت متأكد من حذف جميع الطلاب؟ سيتم حذف جميع التقييمات المرتبطة بهم.")) {
      return;
    }
    
    try {
      await axios.delete(`${API}/classes/${classId}/students`);
      fetchStudents();
      fetchStatistics();
      alert("تم حذف جميع الطلاب بنجاح");
    } catch (err) {
      console.error(err);
      alert("خطأ في حذف الطلاب");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            العودة للفصول
          </button>
          <h1 className="text-3xl font-bold text-center">
            {classDetails ? classDetails.name : "جاري التحميل..."}
          </h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Student Management */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4 text-right">إدارة الطلاب</h2>
              
              {/* Toggle between manual and file upload */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => setUploadMode("manual")}
                  className={`px-4 py-2 rounded-l ${
                    uploadMode === "manual" ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                >
                  إضافة يدوية
                </button>
                <button
                  onClick={() => setUploadMode("file")}
                  className={`px-4 py-2 rounded-r ${
                    uploadMode === "file" ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                >
                  استيراد من ملف
                </button>
              </div>
              
              {uploadMode === "manual" ? (
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-right mb-2">رقم الطالب</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-right"
                      value={newStudent.student_number}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, student_number: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-right mb-2">اسم الطالب (اختياري)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-right"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  >
                    إضافة طالب
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-right mb-2">
                    <p className="text-sm text-gray-600 mb-1">
                      قم بتحميل ملف Excel (.csv) يحتوي على أعمدة:
                    </p>
                    <p className="text-sm text-gray-600">student_number, name (اختياري)</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  <button
                    onClick={handleUploadStudents}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    disabled={!fileContent}
                  >
                    استيراد الطلاب
                  </button>
                </div>
              )}
              
              <div className="mt-6">
                <button
                  onClick={handleDeleteAllStudents}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                  disabled={students.length === 0}
                >
                  حذف جميع الطلاب
                </button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-right">روابط سريعة</h2>
              <div className="space-y-2">
                <Link
                  to={`/classes/${classId}/assessment`}
                  className="block w-full bg-green-500 text-white py-2 px-4 rounded text-center hover:bg-green-600"
                >
                  تقييم المشاركة
                </Link>
                <Link
                  to={`/classes/${classId}/reports`}
                  className="block w-full bg-purple-500 text-white py-2 px-4 rounded text-center hover:bg-purple-600"
                >
                  تقارير المشاركة
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right column: Students List and Statistics */}
          <div className="lg:col-span-2">
            {/* Statistics Summary */}
            {statistics && (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4 text-right">إحصائيات الفصل</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">إجمالي الطلاب</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.total_students}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">الطلاب المقيمين</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.assessed_students}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">إجابات صحيحة</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.correct_answers}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">إجابات خاطئة</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.wrong_answers}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Students List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-right">قائمة الطلاب</h2>
              
              {loading ? (
                <div className="text-center py-4">جاري التحميل...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-4 text-gray-500">لا يوجد طلاب في هذا الفصل</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-4 py-2 text-right">رقم الطالب</th>
                        <th className="border px-4 py-2 text-right">اسم الطالب</th>
                        {statistics && (
                          <>
                            <th className="border px-4 py-2 text-center">إجابات صحيحة</th>
                            <th className="border px-4 py-2 text-center">إجابات خاطئة</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const studentStats = statistics?.student_details?.find(
                          (s) => s.student_id === student.id
                        ) || { correct: 0, wrong: 0 };
                        
                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="border px-4 py-2 text-right">{student.student_number}</td>
                            <td className="border px-4 py-2 text-right">
                              {student.name || "-"}
                            </td>
                            {statistics && (
                              <>
                                <td className="border px-4 py-2 text-center text-green-600">
                                  {studentStats.correct || 0}
                                </td>
                                <td className="border px-4 py-2 text-center text-red-600">
                                  {studentStats.wrong || 0}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Assessment page
const Assessment = () => {
  const { classId } = useParams();
  const [classDetails, setClassDetails] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchClassDetails();
    fetchStatistics();
    getNextStudent();
  }, [classId]);
  
  const fetchClassDetails = async () => {
    try {
      const response = await axios.get(`${API}/classes/${classId}`);
      setClassDetails(response.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API}/classes/${classId}/statistics`);
      setStatistics(response.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const getNextStudent = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/classes/${classId}/random-student`);
      setCurrentStudent(response.data);
      setAssessmentComplete(false);
      setLoading(false);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        // No eligible students found, all students have been assessed
        setAssessmentComplete(true);
        // Show alert using SweetAlert style (using plain JS alert for simplicity)
        alert("تم تقييم جميع الطلاب");
        
        // Fetch all students and pick a random one to start a new cycle
        try {
          const studentsResponse = await axios.get(`${API}/classes/${classId}/students`);
          if (studentsResponse.data.length > 0) {
            const randomIndex = Math.floor(Math.random() * studentsResponse.data.length);
            setCurrentStudent(studentsResponse.data[randomIndex]);
          } else {
            setCurrentStudent(null);
          }
        } catch (studErr) {
          console.error(studErr);
          setCurrentStudent(null);
        }
      } else {
        setCurrentStudent(null);
      }
      setLoading(false);
    }
  };
  
  const handleAssessment = async (score) => {
    if (!currentStudent) return;
    
    if (score === "pass") {
      // Skip to next student without recording
      getNextStudent();
      return;
    }
    
    try {
      await axios.post(`${API}/classes/${classId}/assessments`, {
        student_id: currentStudent.id,
        score: score === "correct" ? 1 : 0
      });
      fetchStatistics();
      getNextStudent();
    } catch (err) {
      console.error(err);
      alert("خطأ في تسجيل التقييم");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(`/classes/${classId}`)}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            العودة للفصل
          </button>
          <h1 className="text-3xl font-bold text-center">
            تقييم المشاركة - {classDetails ? classDetails.name : "جاري التحميل..."}
          </h1>
        </div>
        
        {/* Statistics bar */}
        {statistics && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
            <div className="text-lg font-semibold">
              الطلاب المقيَّمين: {statistics.assessed_students} / {statistics.total_students}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>{statistics.correct_answers} إجابة صحيحة</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>{statistics.wrong_answers} إجابة خاطئة</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-lg">جاري اختيار طالب...</p>
            </div>
          ) : !currentStudent ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">لا يوجد طلاب في هذا الفصل</p>
              <button
                onClick={() => navigate(`/classes/${classId}`)}
                className="mt-4 bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600"
              >
                إضافة طلاب
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-2">
                  {currentStudent.name || "طالب رقم " + currentStudent.student_number}
                </h2>
                <p className="text-lg text-gray-600">رقم الطالب: {currentStudent.student_number}</p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleAssessment("wrong")}
                  className="bg-red-500 text-white py-4 px-8 rounded-lg text-xl hover:bg-red-600 transition-colors"
                >
                  خطأ
                </button>
                <button
                  onClick={() => handleAssessment("pass")}
                  className="bg-yellow-500 text-white py-4 px-8 rounded-lg text-xl hover:bg-yellow-600 transition-colors"
                >
                  تخطي
                </button>
                <button
                  onClick={() => handleAssessment("correct")}
                  className="bg-green-500 text-white py-4 px-8 rounded-lg text-xl hover:bg-green-600 transition-colors"
                >
                  صحيح
                </button>
              </div>
              
              <div className="text-center mt-8 text-gray-500">
                <p>اضغط على الإجابة المناسبة لتقييم الطالب</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Reports page
const Reports = () => {
  const { classId } = useParams();
  const [classDetails, setClassDetails] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchClassDetails();
    fetchAssessments();
    fetchStudents();
    fetchStatistics();
  }, [classId]);
  
  const fetchClassDetails = async () => {
    try {
      const response = await axios.get(`${API}/classes/${classId}`);
      setClassDetails(response.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const fetchAssessments = async () => {
    try {
      const response = await axios.get(`${API}/classes/${classId}/assessments`);
      setAssessments(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };
  
  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/classes/${classId}/students`);
      setStudents(response.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API}/classes/${classId}/statistics`);
      setStatistics(response.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  // Group assessments by student
  const studentAssessments = {};
  assessments.forEach(assessment => {
    if (!studentAssessments[assessment.student_id]) {
      studentAssessments[assessment.student_id] = [];
    }
    studentAssessments[assessment.student_id].push(assessment);
  });
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(`/classes/${classId}`)}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            العودة للفصل
          </button>
          <h1 className="text-3xl font-bold text-center">
            تقارير المشاركة - {classDetails ? classDetails.name : "جاري التحميل..."}
          </h1>
        </div>
        
        {/* Statistics Summary */}
        {statistics && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4 text-right">ملخص الإحصائيات</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">إجمالي الطلاب</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.total_students}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">الطلاب المقيمين</p>
                <p className="text-2xl font-bold text-green-600">{statistics.assessed_students}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">إجابات صحيحة</p>
                <p className="text-2xl font-bold text-green-600">{statistics.correct_answers}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">إجابات خاطئة</p>
                <p className="text-2xl font-bold text-red-600">{statistics.wrong_answers}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Student Performance Table */}
        {statistics && statistics.student_details && statistics.student_details.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4 text-right">أداء الطلاب</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-right">رقم الطالب</th>
                    <th className="border px-4 py-2 text-right">اسم الطالب</th>
                    <th className="border px-4 py-2 text-center">إجابات صحيحة</th>
                    <th className="border px-4 py-2 text-center">إجابات خاطئة</th>
                    <th className="border px-4 py-2 text-center">نسبة الإجابات الصحيحة</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.student_details.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2 text-right">{student.student_number}</td>
                      <td className="border px-4 py-2 text-right">{student.student_name || "-"}</td>
                      <td className="border px-4 py-2 text-center text-green-600">{student.correct}</td>
                      <td className="border px-4 py-2 text-center text-red-600">{student.wrong}</td>
                      <td className="border px-4 py-2 text-center">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-blue-600 h-4 rounded-full"
                            style={{ width: `${student.correct_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{student.correct_percentage}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Detailed Assessment History */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-right">سجل التقييمات التفصيلي</h2>
          
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">لا توجد تقييمات مسجلة</div>
          ) : (
            <div className="space-y-6">
              {students.map((student) => {
                const studentAsmts = studentAssessments[student.id] || [];
                if (studentAsmts.length === 0) return null;
                
                return (
                  <div key={student.id} className="border-b pb-4 last:border-b-0">
                    <h3 className="text-lg font-semibold mb-2 text-right">
                      {student.name || "طالب رقم " + student.student_number}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border px-4 py-2 text-right">التاريخ</th>
                            <th className="border px-4 py-2 text-right">اليوم</th>
                            <th className="border px-4 py-2 text-right">الوقت</th>
                            <th className="border px-4 py-2 text-center">النتيجة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentAsmts.map((assessment) => {
                            const date = new Date(assessment.date);
                            const dayNames = [
                              "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
                            ];
                            
                            return (
                              <tr key={assessment.id} className="hover:bg-gray-50">
                                <td className="border px-4 py-2 text-right">
                                  {date.toLocaleDateString("ar-SA")}
                                </td>
                                <td className="border px-4 py-2 text-right">
                                  {dayNames[date.getDay()]}
                                </td>
                                <td className="border px-4 py-2 text-right">
                                  {date.toLocaleTimeString("ar-SA")}
                                </td>
                                <td className="border px-4 py-2 text-center">
                                  {assessment.score === 1 ? (
                                    <span className="text-green-500">إجابة صحيحة</span>
                                  ) : (
                                    <span className="text-red-500">إجابة خاطئة</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App" dir="rtl">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/classes/:classId" element={<RequireAuth><ClassManagement /></RequireAuth>} />
          <Route path="/classes/:classId/assessment" element={<RequireAuth><Assessment /></RequireAuth>} />
          <Route path="/classes/:classId/reports" element={<RequireAuth><Reports /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
