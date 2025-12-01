import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, LogOut, CheckCircle, HelpCircle, ChevronLeft, ChevronRight, User, RefreshCw, AlertCircle, Lock, ArrowRight } from 'lucide-react';

// --- CẤU HÌNH: ĐƯỜNG DẪN DỮ LIỆU ---

// 1. Link dữ liệu CÂU HỎI (Sheet "cauhoi")
const QUESTIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzAJgPL7HRlqiDRjj_8-cmY0NhuPkonAZSIGToSREQcpZVrDCvXTXLSz3stZzSzds0_GsVp8hKbMA0/pubhtml?gid=0&single=true"; 

// 2. Link dữ liệu NGƯỜI DÙNG ĐƯỢC PHÉP (Sheet "users")
const ALLOWED_USERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzAJgPL7HRlqiDRjj_8-cmY0NhuPkonAZSIGToSREQcpZVrDCvXTXLSz3stZzSzds0_GsVp8hKbMA0/pubhtml?gid=1298018390&single=true"; 

// --- DỮ LIỆU MẪU ---
const FALLBACK_DATA = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  question: `Dữ liệu mẫu (Do chưa có link CSV Câu hỏi). Vui lòng cập nhật biến QUESTIONS_CSV_URL trong code.`,
  correctAnswer: `Đáp án 1`,
  options: [`Đáp án 1`, `Đáp án 2`, `Đáp án 3`, `Đáp án 4`]
}));

// --- HÀM HỖ TRỢ: PHÂN TÍCH CSV ---
const parseCSV = (text) => {
  const rows = text.split('\n').map(row => {
    return row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => 
      cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
    );
  });
  return rows; 
};

// Helper: Parse Câu hỏi
const parseQuestions = (rows) => {
  const dataRows = rows.slice(1).filter(r => r.length > 2 && r[1]);
  return dataRows.map((col, index) => {
    const options = [col[3], col[4], col[5], col[6], col[7]].filter(opt => opt && opt.trim() !== '');
    let correctText = col[2];
    const correctIndex = parseInt(col[2]);
    if (!isNaN(correctIndex) && correctIndex > 0 && correctIndex <= options.length) {
      correctText = options[correctIndex - 1];
    } else {
       const match = col[2] ? col[2].match(/\d+/) : null;
       if(match) {
         const idx = parseInt(match[0]);
         if(idx > 0 && idx <= options.length) correctText = options[idx - 1];
       }
    }
    return {
      id: index + 1,
      question: col[1],
      correctAnswer: correctText,
      options: options
    };
  });
};

// Helper: Parse Users
const parseAllowedUsers = (rows) => {
  if (rows.length < 2) return [];
  const headerRow = rows[0].map(cell => cell.toLowerCase());
  const emailColIndex = headerRow.findIndex(h => h.includes('email'));
  const targetCol = emailColIndex !== -1 ? emailColIndex : 0;

  return rows.slice(1)
    .map(r => r[targetCol] ? r[targetCol].toLowerCase().trim() : '')
    .filter(email => email);
};

// Helper: Xáo trộn mảng
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- COMPONENT THẺ CÂU HỎI ---
const QuestionCard = ({ item, index, showResultImmediately = false }) => {
  const [isRevealed, setIsRevealed] = useState(showResultImmediately);

  useEffect(() => {
    if (!showResultImmediately) setIsRevealed(false);
  }, [item, showResultImmediately]);

  const correctIndex = item.options.findIndex(opt => opt === item.correctAnswer);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          <span className="text-blue-600 mr-2">Câu {item.id}:</span>
          {item.question}
        </h3>
      </div>
      <div className="space-y-3">
        {item.options.map((opt, idx) => {
          let btnClass = "w-full text-left p-3 rounded border transition-all ";
          if (isRevealed) {
            if (opt === item.correctAnswer) {
              btnClass += "bg-green-100 border-green-500 text-green-800 font-medium";
            } else if (idx === correctIndex) {
               btnClass += "bg-green-100 border-green-500 text-green-800 font-medium";
            } else {
              btnClass += "bg-gray-50 border-gray-200 text-gray-500 opacity-70";
            }
          } else {
            btnClass += "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700";
          }
          return <div key={idx} className={btnClass}>{opt}</div>;
        })}
      </div>
      {!showResultImmediately && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setIsRevealed(true)}
            disabled={isRevealed}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              isRevealed ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <CheckCircle size={16} /> {isRevealed ? "Đã hiện đáp án" : "Xem đáp án"}
          </button>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT CHÍNH ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inputEmail, setInputEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [view, setView] = useState('review');
  const [dataLoading, setDataLoading] = useState(false);
  const [fullData, setFullData] = useState([]);
  const [reviewData, setReviewData] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [searchTerm, setSearchTerm] = useState('');

  // Đã xóa phần useEffect tải Tailwind ở đây vì đã thêm vào index.html

  useEffect(() => {
    const savedUser = localStorage.getItem('qa_app_user');
    if (savedUser) {
      setCurrentUser(savedUser);
      fetchQuestions();
    }
  }, []);

  const fetchQuestions = async () => {
    setDataLoading(true);
    setErrorMsg('');
    try {
      if (!QUESTIONS_CSV_URL) {
        setFullData(FALLBACK_DATA);
        setReviewData(shuffleArray(FALLBACK_DATA));
        setDataLoading(false);
        return;
      }
      const response = await fetch(QUESTIONS_CSV_URL);
      if (!response.ok) throw new Error("Không thể tải dữ liệu câu hỏi");
      const text = await response.text();
      const rows = parseCSV(text);
      const parsedData = parseQuestions(rows);
      
      if (parsedData.length === 0) throw new Error("File không có dữ liệu");

      setFullData(parsedData);
      setReviewData(shuffleArray(parsedData));
    } catch (err) {
      setErrorMsg("Lỗi tải dữ liệu: " + err.message);
      setFullData(FALLBACK_DATA);
      setReviewData(shuffleArray(FALLBACK_DATA));
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch(ALLOWED_USERS_CSV_URL);
      if (!response.ok) throw new Error("Không thể kết nối danh sách User");
      
      const text = await response.text();
      const rows = parseCSV(text);
      
      const allowedEmails = parseAllowedUsers(rows);
      
      const emailToCheck = inputEmail.toLowerCase().trim();

      if (allowedEmails.includes(emailToCheck)) {
        setCurrentUser(emailToCheck);
        localStorage.setItem('qa_app_user', emailToCheck);
        fetchQuestions();
      } else {
        setLoginError('Email này không có quyền truy cập.');
      }
    } catch (error) {
      setLoginError('Lỗi kiểm tra: ' + error.message);
      console.error(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qa_app_user');
    setCurrentUser(null);
    setInputEmail('');
    setReviewData([]);
  };

  const currentQuestions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return reviewData.slice(start, start + itemsPerPage);
  }, [currentPage, reviewData]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return fullData.filter(item => 
      item.question.toLowerCase().includes(term)
    );
  }, [searchTerm, fullData]);

  if (!currentUser) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Lock className="text-blue-600" size={32} />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Đăng nhập hệ thống</h1>
          <p className="text-gray-500 text-center mb-6 text-sm">Nhập email của bạn để kiểm tra quyền truy cập</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="vidu@gmail.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
              />
            </div>
            
            {loginError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white flex justify-center items-center gap-2 transition-all ${
                isLoggingIn ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoggingIn ? <RefreshCw className="animate-spin" /> : <ArrowRight size={20} />}
              {isLoggingIn ? 'Đang kiểm tra...' : 'Truy cập'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            Dữ liệu được kiểm tra trực tiếp từ Google Sheets
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            <span className="font-bold text-xl text-gray-800 hidden sm:block">Q&A Master</span>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => { fetchQuestions(); setCurrentPage(1); window.scrollTo(0,0); }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-1 text-sm font-medium"
              title="Tải lại dữ liệu mới nhất"
            >
              <RefreshCw size={18} className={dataLoading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Cập nhật đề</span>
            </button>
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <User size={14} />
              <span className="max-w-[100px] truncate sm:max-w-none">{currentUser}</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
              title="Đăng xuất"
            >
              <LogOut size={20}/>
            </button>
          </div>
        </div>
      </header>

      {!QUESTIONS_CSV_URL && !dataLoading && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 text-center animate-pulse">
          ⚠ Bạn chưa nhập link "Câu hỏi". Hãy cập nhật biến <b>QUESTIONS_CSV_URL</b> trong code.
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 flex gap-6">
          <button onClick={() => setView('review')} className={`py-4 px-2 text-sm font-medium border-b-2 flex gap-2 transition-all ${view === 'review' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <HelpCircle size={18} /> Ôn tập
          </button>
          <button onClick={() => setView('search')} className={`py-4 px-2 text-sm font-medium border-b-2 flex gap-2 transition-all ${view === 'search' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Search size={18} /> Tra cứu
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {view === 'review' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800">Trang {currentPage} / {Math.ceil(reviewData.length / itemsPerPage) || 1}</h2>
                   <span className="text-sm bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600 shadow-sm">{reviewData.length} câu hỏi</span>
                </div>
                {currentQuestions.map((item, index) => (
                  <QuestionCard key={item.id} item={item} index={index} />
                ))}
                
                <div className="flex justify-center gap-4 mt-8 pb-8">
                  <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }} disabled={currentPage === 1} className="flex items-center gap-1 px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 shadow-sm">
                    <ChevronLeft size={16}/> Trước
                  </button>
                  <button onClick={() => { setCurrentPage(p => Math.min(Math.ceil(reviewData.length / itemsPerPage), p + 1)); window.scrollTo(0, 0); }} disabled={currentPage >= Math.ceil(reviewData.length / itemsPerPage)} className="flex items-center gap-1 px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 shadow-sm">
                    Sau <ChevronRight size={16}/>
                  </button>
                </div>
              </div>
            )}

            {view === 'search' && (
              <div className="animate-fade-in">
                <div className="relative mb-8 group">
                  <input 
                    type="text" 
                    placeholder="Nhập từ khóa để tìm kiếm..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full p-4 pl-12 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all group-hover:shadow-md" 
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={24} />
                </div>
                {searchTerm && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Tìm thấy {searchResults.length} kết quả</h3>
                    {searchResults.map((item, index) => <QuestionCard key={item.id} item={item} index={index} showResultImmediately={true} />)}
                  </div>
                )}
                {!searchTerm && (
                  <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    <Search className="mx-auto mb-2 opacity-20" size={48} />
                    <p>Nhập từ khóa vào ô tìm kiếm để bắt đầu</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}