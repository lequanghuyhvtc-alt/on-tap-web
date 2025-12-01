import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, BookOpen, LogOut, CheckCircle, HelpCircle, ChevronLeft, ChevronRight, User, RefreshCw, AlertCircle, Lock, ArrowRight, Clock, Play, Award, RotateCcw } from 'lucide-react';

// --- CẤU HÌNH ---
const QUESTIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzAJgPL7HRlqiDRjj_8-cmY0NhuPkonAZSIGToSREQcpZVrDCvXTXLSz3stZzSzds0_GsVp8hKbMA0/pub?gid=0&single=true&output=csv"; 
const ALLOWED_USERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzAJgPL7HRlqiDRjj_8-cmY0NhuPkonAZSIGToSREQcpZVrDCvXTXLSz3stZzSzds0_GsVp8hKbMA0/pub?gid=1298018390&single=true&output=csv"; 

// --- CODE XỬ LÝ CSV (GIỮ NGUYÊN) ---
const parseCSV = (text) => {
  const rows = text.split('\n').map(row => {
    return row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => 
      cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
    );
  });
  return rows; 
};

const parseQuestions = (rows) => {
  const dataRows = rows.slice(1).filter(r => r.length > 1 && (r[1] || r[2]));
  return dataRows.map((col, index) => {
    const options = [col[3], col[4], col[5], col[6], col[7]].map(opt => opt ? opt.toString().trim() : "");
    const rawCol2 = col[2]; 
    let rawAns = rawCol2 ? rawCol2.toString().toLowerCase().trim() : '';
    const cleanAns = rawAns.replace(/[^a-z0-9]/g, '');

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
      correctIndex: finalIndex
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

// --- COMPONENT THẺ CÂU HỎI (ĐA NĂNG) ---
const QuestionCard = ({ 
  item, 
  index, 
  mode = 'review', // 'review' (ôn tập), 'exam_taking' (đang thi), 'exam_result' (kết quả thi)
  selectedOption = null, // Đáp án người dùng chọn (cho chế độ thi)
  onSelectOption = () => {}, // Hàm xử lý khi chọn đáp án
  showResultImmediately = false 
}) => {
  const [isRevealed, setIsRevealed] = useState(showResultImmediately);

  // Reset trạng thái khi câu hỏi thay đổi (chỉ dùng cho chế độ ôn tập)
  useEffect(() => {
    if (mode === 'review' && !showResultImmediately) setIsRevealed(false);
  }, [item, showResultImmediately, mode]);

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

          let btnClass = "w-full text-left p-3 rounded border transition-all flex items-center cursor-pointer ";
          
          // --- LOGIC HIỂN THỊ MÀU SẮC ---
          
          if (mode === 'exam_taking') {
            // CHẾ ĐỘ ĐANG THI: Chỉ highlight cái đang chọn
            if (selectedOption === idx) {
              btnClass += "bg-blue-100 border-blue-500 text-blue-900 font-medium ring-1 ring-blue-300";
            } else {
              btnClass += "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700";
            }
          } 
          else if (mode === 'exam_result') {
            // CHẾ ĐỘ KẾT QUẢ THI: Hiện đúng/sai
            if (idx === item.correctIndex) {
              // Đáp án đúng luôn xanh
              btnClass += "bg-green-100 border-green-500 text-green-900 font-bold shadow-sm";
            } else if (idx === selectedOption) {
              // Đã chọn sai -> Màu đỏ
              btnClass += "bg-red-100 border-red-500 text-red-900 font-medium opacity-80";
            } else {
              btnClass += "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
            }
          } 
          else {
            // CHẾ ĐỘ ÔN TẬP (Cũ)
            if (isRevealed) {
              if (idx === item.correctIndex) {
                btnClass += "bg-green-100 border-green-500 text-green-800 font-bold shadow-sm ring-1 ring-green-400";
              } else {
                btnClass += "bg-gray-50 border-gray-200 text-gray-400 opacity-60";
              }
            } else {
              btnClass += "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700";
            }
          }
          
          return (
            <div 
              key={idx} 
              className={btnClass}
              onClick={() => mode === 'exam_taking' && onSelectOption(idx)}
            >
              <span className={`w-6 h-6 flex items-center justify-center mr-3 text-xs font-mono rounded ${
                mode === 'exam_taking' && selectedOption === idx ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{opt}</span>
            </div>
          );
        })}
      </div>

      {/* Nút xem đáp án (Chỉ hiện ở chế độ Review) */}
      {mode === 'review' && !showResultImmediately && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setIsRevealed(true)}
            disabled={isRevealed}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              isRevealed ? "bg-gray-100 text-gray-500 cursor-default" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            }`}
          >
            <CheckCircle size={16} /> {isRevealed ? "Đã hiện đáp án" : "Xem đáp án"}
          </button>
        </div>
      )}
    </div>
  );
};

// --- APP CHÍNH ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inputEmail, setInputEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // States dữ liệu
  const [view, setView] = useState('review'); // 'review' | 'search' | 'exam'
  const [dataLoading, setDataLoading] = useState(false);
  const [fullData, setFullData] = useState([]);
  const [reviewData, setReviewData] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  // States phân trang (Ôn tập)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [searchTerm, setSearchTerm] = useState('');

  // STATES CHO CHẾ ĐỘ THI THỬ
  const [examStatus, setExamStatus] = useState('intro'); // 'intro' | 'playing' | 'finished'
  const [examQuestions, setExamQuestions] = useState([]); // 20 câu hỏi thi
  const [userAnswers, setUserAnswers] = useState({}); // { idCauHoi: indexChon }
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 phút tính bằng giây
  const timerRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('qa_app_user');
    if (savedUser) {
      setCurrentUser(savedUser);
      fetchQuestions();
    }
  }, []);

  // -- TIMER LOGIC --
  useEffect(() => {
    if (examStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitExam(); // Hết giờ tự nộp
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [examStatus]);

  const fetchQuestions = async () => {
    setDataLoading(true);
    try {
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

  // --- LOGIC THI THỬ ---
  const handleStartExam = () => {
    if (fullData.length === 0) return;
    // Lấy ngẫu nhiên 20 câu
    const shuffled = shuffleArray(fullData);
    const selected = shuffled.slice(0, 20);
    setExamQuestions(selected);
    setUserAnswers({});
    setTimeLeft(30 * 60); // Reset 30 phút
    setExamStatus('playing');
    window.scrollTo(0, 0);
  };

  const handleSelectAnswer = (questionId, optionIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitExam = () => {
    setExamStatus('finished');
    window.scrollTo(0, 0);
  };

  const calculateScore = () => {
    let correctCount = 0;
    examQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Memo dữ liệu ôn tập
  const currentQuestions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return reviewData.slice(start, start + itemsPerPage);
  }, [currentPage, reviewData]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return fullData.filter(item => item.question.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, fullData]);

  // --- GIAO DIỆN ĐĂNG NHẬP ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-800 p-4 font-sans">
        <div className="bg-white p-8 rounded-xl max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Lock className="text-blue-600" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Đăng Nhập Hệ Thống</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="email" required placeholder="Nhập email..." 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={inputEmail} onChange={e => setInputEmail(e.target.value)}
              />
            </div>
            {loginError && <div className="text-red-500 text-sm">{loginError}</div>}
            <button type="submit" disabled={isLoggingIn} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg">
              {isLoggingIn ? "Đang kiểm tra..." : "Truy cập ngay"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN CHÍNH ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-gray-800">
            <BookOpen className="text-blue-600" /> CHÚC BẠN CÓ KẾT QUẢ THI THẬT TỐT
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => { fetchQuestions(); setCurrentPage(1); }} className="p-2 text-blue-600 bg-blue-50 rounded-full flex items-center gap-1 text-sm font-medium hover:bg-blue-100 transition-colors">
              <RefreshCw size={18} className={dataLoading ? "animate-spin" : ""} /> <span className="hidden sm:inline">Cập nhật đề</span>
            </button>
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
               <User size={14} />
               <span className="truncate max-w-[100px] sm:max-w-none">{currentUser}</span>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      {/* Tabs Menu */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 flex gap-6">
          <button onClick={() => setView('review')} className={`py-4 px-2 border-b-2 font-medium transition-colors ${view === 'review' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <HelpCircle size={18} className="inline mr-2"/> Ôn tập
          </button>
          <button onClick={() => setView('search')} className={`py-4 px-2 border-b-2 font-medium transition-colors ${view === 'search' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Search size={18} className="inline mr-2"/> Tra cứu
          </button>
          <button onClick={() => setView('exam')} className={`py-4 px-2 border-b-2 font-medium transition-colors ${view === 'exam' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Clock size={18} className="inline mr-2"/> Thi thử
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
            <p>Đang tải dữ liệu mới nhất...</p>
          </div>
        ) : (
          <>
            {/* --- VIEW: ÔN TẬP --- */}
            {view === 'review' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800">Trang {currentPage}</h2>
                   <span className="text-sm bg-white border px-3 py-1 rounded-full text-gray-600 shadow-sm">{reviewData.length} câu</span>
                </div>
                {currentQuestions.map((item, index) => (
                  <QuestionCard key={item.id} item={item} index={index} mode="review" />
                ))}
                
                <div className="flex justify-center gap-4 mt-8 pb-8">
                  <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0,0); }} disabled={currentPage === 1} className="flex items-center gap-1 px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-colors">
                    <ChevronLeft size={16}/> Trước
                  </button>
                  <button onClick={() => { setCurrentPage(p => Math.min(Math.ceil(reviewData.length / itemsPerPage), p + 1)); window.scrollTo(0,0); }} disabled={currentPage >= Math.ceil(reviewData.length / itemsPerPage)} className="flex items-center gap-1 px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-colors">
                    Sau <ChevronRight size={16}/>
                  </button>
                </div>
              </div>
            )}

            {/* --- VIEW: TRA CỨU --- */}
            {view === 'search' && (
              <div className="animate-fade-in">
                <div className="relative mb-8 group">
                  <input type="text" placeholder="Nhập từ khóa tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-4 pl-12 rounded-xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all group-hover:shadow-md" />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={24} />
                </div>
                {searchTerm ? (
                  searchResults.length > 0 ? (
                    searchResults.map((item, index) => (
                      <QuestionCard key={item.id} item={item} index={index} showResultImmediately={true} mode="review" />
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400">Không tìm thấy kết quả nào</div>
                  )
                ) : (
                  <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    <Search className="mx-auto mb-2 opacity-20" size={48} />
                    <p>Nhập từ khóa để bắt đầu tra cứu</p>
                  </div>
                )}
              </div>
            )}

            {/* --- VIEW: THI THỬ --- */}
            {view === 'exam' && (
              <div className="animate-fade-in">
                
                {/* 1. Màn hình Chào mừng */}
                {examStatus === 'intro' && (
                  <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-2xl mx-auto border border-blue-100">
                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Award className="text-blue-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Chế độ Thi Thử</h2>
                    <ul className="text-left text-gray-600 mb-8 space-y-3 bg-gray-50 p-6 rounded-lg">
                      <li className="flex gap-2"><CheckCircle size={18} className="text-green-500"/> Hệ thống sẽ chọn ngẫu nhiên <b>20 câu hỏi</b>.</li>
                      <li className="flex gap-2"><Clock size={18} className="text-orange-500"/> Thời gian làm bài: <b>30 phút</b>.</li>
                      <li className="flex gap-2"><AlertCircle size={18} className="text-blue-500"/> Hết giờ hệ thống sẽ tự động nộp bài.</li>
                    </ul>
                    <button 
                      onClick={handleStartExam}
                      className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 mx-auto"
                    >
                      <Play size={20} fill="currentColor" /> Bắt đầu làm bài
                    </button>
                  </div>
                )}

                {/* 2. Màn hình Đang thi */}
                {examStatus === 'playing' && (
                  <div>
                    {/* Thanh công cụ dính trên cùng */}
                    <div className="bg-white p-4 rounded-lg shadow-md mb-6 sticky top-20 z-10 flex justify-between items-center border border-blue-200">
                      <div className="flex items-center gap-2 text-orange-600 font-bold text-xl font-mono">
                        <Clock className="animate-pulse" /> {formatTime(timeLeft)}
                      </div>
                      <button 
                        onClick={() => { if(window.confirm('Bạn có chắc chắn muốn nộp bài sớm?')) handleSubmitExam(); }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm"
                      >
                        Nộp bài
                      </button>
                    </div>

                    {/* Danh sách câu hỏi thi */}
                    <div className="space-y-8">
                      {examQuestions.map((item, index) => (
                        <QuestionCard 
                          key={item.id} 
                          item={item} 
                          index={index} 
                          mode="exam_taking" 
                          selectedOption={userAnswers[item.id]}
                          onSelectOption={(optIdx) => handleSelectAnswer(item.id, optIdx)}
                        />
                      ))}
                    </div>

                    <div className="mt-8 text-center">
                       <button 
                        onClick={handleSubmitExam}
                        className="bg-green-600 text-white px-10 py-4 rounded-full font-bold text-xl hover:bg-green-700 shadow-lg"
                      >
                        Hoàn thành bài thi
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Màn hình Kết quả */}
                {examStatus === 'finished' && (
                  <div>
                    <div className="bg-white p-6 rounded-xl shadow-lg mb-8 text-center border-t-4 border-blue-500">
                      <h2 className="text-xl text-gray-600 font-medium mb-2">Kết quả bài thi</h2>
                      <div className="text-5xl font-bold text-blue-600 mb-4">
                        {calculateScore()} <span className="text-2xl text-gray-400 font-normal">/ 20</span>
                      </div>
                      <p className="text-gray-500 mb-6">Bạn đã hoàn thành bài thi trong thời gian {formatTime(30 * 60 - timeLeft)}</p>
                      <button 
                        onClick={handleStartExam}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 flex items-center gap-2 mx-auto"
                      >
                        <RotateCcw size={18} /> Thi lại đề mới
                      </button>
                    </div>

                    <h3 className="font-bold text-lg text-gray-800 mb-4">Chi tiết đáp án:</h3>
                    <div className="space-y-8">
                      {examQuestions.map((item, index) => (
                        <QuestionCard 
                          key={item.id} 
                          item={item} 
                          index={index} 
                          mode="exam_result" 
                          selectedOption={userAnswers[item.id]}
                        />
                      ))}
                    </div>
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