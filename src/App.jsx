import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, LogOut, CheckCircle, HelpCircle, ChevronLeft, ChevronRight, User, RefreshCw, AlertCircle, Lock, ArrowRight, Bug } from 'lucide-react';

// --- CẤU HÌNH ---
// Đã thêm tham số t=... để ép Google cập nhật dữ liệu mới ngay lập tức
const QUESTIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzAJgPL7HRlqiDRjj_8-cmY0NhuPkonAZSIGToSREQcpZVrDCvXTXLSz3stZzSzds0_GsVp8hKbMA0/pub?gid=0&single=true&output=csv"; 
const ALLOWED_USERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzAJgPL7HRlqiDRjj_8-cmY0NhuPkonAZSIGToSREQcpZVrDCvXTXLSz3stZzSzds0_GsVp8hKbMA0/pub?gid=1298018390&single=true&output=csv"; 

// --- CODE XỬ LÝ CSV ---
const parseCSV = (text) => {
  const rows = text.split('\n').map(row => {
    // Regex xử lý dấu phẩy trong ngoặc kép
    return row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => 
      cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
    );
  });
  return rows; 
};

const parseQuestions = (rows) => {
  // Bỏ dòng tiêu đề (hàng 1)
  const dataRows = rows.slice(1).filter(r => r.length > 1 && (r[1] || r[2]));
  
  return dataRows.map((col, index) => {
    // Lấy options từ cột index 3,4,5,6,7 (D, E, F, G, H)
    const options = [col[3], col[4], col[5], col[6], col[7]].map(opt => opt ? opt.toString().trim() : "");
    
    // Lấy đáp án từ cột index 2 (C)
    const rawCol2 = col[2]; 
    let rawAns = rawCol2 ? rawCol2.toString().toLowerCase().trim() : '';
    const cleanAns = rawAns.replace(/[^a-z0-9]/g, ''); // Xóa ký tự lạ

    let finalIndex = -1;
    const charMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4 };

    if (charMap.hasOwnProperty(cleanAns)) {
      finalIndex = charMap[cleanAns];
    } else {
      const num = parseInt(cleanAns);
      if (!isNaN(num) && num > 0) {
        finalIndex = num - 1;
      }
    }

    return {
      id: index + 1,
      question: col[1] || "Lỗi: Không có câu hỏi",
      options: options,
      correctIndex: finalIndex,
      debug: { raw: rawCol2, clean: cleanAns, index: finalIndex }
    };
  });
};

const parseAllowedUsers = (rows) => {
  if (rows.length < 2) return [];
  const headerRow = rows[0].map(cell => cell.toLowerCase());
  const emailColIndex = headerRow.findIndex(h => h.includes('email'));
  const targetCol = emailColIndex !== -1 ? emailColIndex : 0;
  return rows.slice(1).map(r => r[targetCol] ? r[targetCol].toLowerCase().trim() : '').filter(email => email);
};

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- COMPONENT HIỂN THỊ CÂU HỎI ---
const QuestionCard = ({ item, index, showResultImmediately = false, debugMode = false }) => {
  const [isRevealed, setIsRevealed] = useState(showResultImmediately);

  useEffect(() => {
    if (!showResultImmediately) setIsRevealed(false);
  }, [item, showResultImmediately]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200 animate-fade-in relative">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          <span className="text-blue-600 mr-2">Câu {item.id}:</span>
          {item.question}
        </h3>
      </div>

      <div className="space-y-3">
        {item.options.map((opt, idx) => {
          if (!opt && idx > 3) return null; 

          let btnClass = "w-full text-left p-3 rounded border transition-all ";
          
          if (isRevealed) {
            if (idx === item.correctIndex) {
              // TÔ MÀU XANH NẾU ĐÚNG
              btnClass += "bg-green-100 border-green-500 text-green-800 font-bold shadow-sm ring-1 ring-green-400";
            } else {
              btnClass += "bg-gray-50 border-gray-200 text-gray-400 opacity-60";
            }
          } else {
            btnClass += "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700";
          }
          
          return (
            <div key={idx} className={btnClass + " flex items-center"}>
              <span className="w-6 h-6 flex items-center justify-center mr-2 text-xs font-mono bg-gray-200 rounded text-gray-600">
                {String.fromCharCode(65 + idx)}
              </span>
              {opt || <span className="italic text-gray-300">(Trống)</span>}
              
              {/* DEBUG: Hiện số index nhỏ bên cạnh */}
              {debugMode && <span className="ml-auto text-[10px] text-gray-400">idx:{idx}</span>}
            </div>
          );
        })}
      </div>

      {/* --- DEBUG BOX (LUÔN HIỆN KHI CÓ LỖI HOẶC BẬT DEBUG) --- */}
      {debugMode && (
        <div className="mt-4 p-3 bg-slate-800 text-green-400 text-xs font-mono rounded">
          <p className="font-bold text-white border-b border-gray-600 mb-2">🕵️ THÔNG TIN GỠ LỖI:</p>
          <div className="grid grid-cols-1 gap-1">
            <div>• Cột Đáp Án (Excel): <span className="bg-gray-600 text-white px-1">"{item.debug?.raw}"</span></div>
            <div>• Code đọc được: <span className="bg-gray-600 text-white px-1">"{item.debug?.clean}"</span></div>
            <div>
              • Index đáp án đúng: 
              <span className={`ml-1 px-1 font-bold ${item.correctIndex === -1 ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}>
                {item.correctIndex}
              </span>
            </div>
            {item.correctIndex === -1 && (
              <p className="text-red-400 mt-1">❌ LỖI: Code không hiểu đáp án "{item.debug?.raw}". Hãy sửa trong Excel thành A, B, C, D hoặc 1, 2, 3.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        {!showResultImmediately && (
          <button
            onClick={() => setIsRevealed(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
          >
            <CheckCircle size={16} /> {isRevealed ? "Đã hiện đáp án" : "Xem đáp án"}
          </button>
        )}
      </div>
    </div>
  );
};

// --- APP CHÍNH ---
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
  
  // QUAN TRỌNG: Mặc định bật Debug Mode lên true để bạn nhìn thấy ngay
  const [debugMode, setDebugMode] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('qa_app_user');
    if (savedUser) {
      setCurrentUser(savedUser);
      fetchQuestions();
    }
  }, []);

  const fetchQuestions = async () => {
    setDataLoading(true);
    try {
      // Thêm timestamp để ép tải dữ liệu mới nhất
      const response = await fetch(`${QUESTIONS_CSV_URL}&t=${Date.now()}`);
      if (!response.ok) throw new Error("Lỗi tải CSV");
      const text = await response.text();
      const rows = parseCSV(text);
      const parsedData = parseQuestions(rows);
      setFullData(parsedData);
      setReviewData(shuffleArray(parsedData));
    } catch (err) {
      setErrorMsg("Lỗi: " + err.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const response = await fetch(`${ALLOWED_USERS_CSV_URL}&t=${Date.now()}`);
      const text = await response.text();
      const allowedEmails = parseAllowedUsers(parseCSV(text));
      const email = inputEmail.toLowerCase().trim();
      if (allowedEmails.includes(email)) {
        setCurrentUser(email);
        localStorage.setItem('qa_app_user', email);
        fetchQuestions();
      } else {
        setLoginError('Email không có quyền truy cập');
      }
    } catch (error) {
      setLoginError('Lỗi: ' + error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qa_app_user');
    setCurrentUser(null);
    setInputEmail('');
  };

  const currentQuestions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return reviewData.slice(start, start + itemsPerPage);
  }, [currentPage, reviewData]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return fullData.filter(item => item.question.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, fullData]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-800 p-4">
        <div className="bg-white p-8 rounded-xl max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Đăng Nhập</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" required placeholder="Nhập email..." 
              className="w-full p-3 border rounded"
              value={inputEmail} onChange={e => setInputEmail(e.target.value)}
            />
            {loginError && <div className="text-red-500 text-sm">{loginError}</div>}
            <button type="submit" disabled={isLoggingIn} className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700">
              {isLoggingIn ? "Đang kiểm tra..." : "Truy cập"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HEADER CÓ NÚT DEBUG */}
      <header className="bg-white shadow sticky top-0 z-20">
        
        {/* THANH CẢNH BÁO PHIÊN BẢN MỚI */}
        <div className="bg-green-600 text-white text-xs text-center py-1 font-bold tracking-wider">
           ✓ ĐÃ CẬP NHẬT PHIÊN BẢN MỚI (CÓ DEBUG)
        </div>

        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-gray-800">
            <BookOpen className="text-blue-600" /> Q&A Master
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => { fetchQuestions(); setCurrentPage(1); }} className="p-2 text-blue-600 bg-blue-50 rounded-full flex items-center gap-1 text-sm font-medium">
              <RefreshCw size={18} className={dataLoading ? "animate-spin" : ""} /> <span className="hidden sm:inline">Cập nhật đề</span>
            </button>
            
            {/* NÚT DEBUG NỔI BẬT */}
            <button 
              onClick={() => setDebugMode(!debugMode)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border transition-colors ${debugMode ? "bg-red-100 text-red-600 border-red-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}
            >
              <Bug size={16} /> {debugMode ? "Tắt Debug" : "Bật Debug"}
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            <span className="text-sm text-gray-600 truncate max-w-[100px]">{currentUser}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 flex gap-6">
          <button onClick={() => setView('review')} className={`py-4 px-2 border-b-2 font-medium ${view === 'review' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Ôn tập</button>
          <button onClick={() => setView('search')} className={`py-4 px-2 border-b-2 font-medium ${view === 'search' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Tra cứu</button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {dataLoading ? (
          <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <>
            {view === 'review' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800">Trang {currentPage}</h2>
                   <span className="text-sm bg-white border px-3 py-1 rounded-full">{reviewData.length} câu</span>
                </div>
                {currentQuestions.map((item, index) => (
                  <QuestionCard key={item.id} item={item} index={index} debugMode={debugMode} />
                ))}
                
                <div className="flex justify-center gap-4 mt-8 pb-8">
                  <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0,0); }} disabled={currentPage === 1} className="px-4 py-2 bg-white border rounded shadow-sm disabled:opacity-50">Trước</button>
                  <button onClick={() => { setCurrentPage(p => Math.min(Math.ceil(reviewData.length / itemsPerPage), p + 1)); window.scrollTo(0,0); }} disabled={currentPage >= Math.ceil(reviewData.length / itemsPerPage)} className="px-4 py-2 bg-white border rounded shadow-sm disabled:opacity-50">Sau</button>
                </div>
              </div>
            )}

            {view === 'search' && (
              <div>
                <div className="relative mb-8">
                  <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-4 pl-12 rounded-xl border shadow-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                </div>
                {searchTerm && searchResults.map((item, index) => (
                  <QuestionCard key={item.id} item={item} index={index} showResultImmediately={true} debugMode={debugMode} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}