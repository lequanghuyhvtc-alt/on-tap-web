import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, BookOpen, LogOut, CheckCircle, HelpCircle, ChevronLeft, ChevronRight, User, RefreshCw, AlertCircle, Lock, ArrowRight, Clock, Play, Award, RotateCcw, ShieldCheck, Frown, Smile, PartyPopper, Moon, Sun, Zap, LayoutGrid, Check } from 'lucide-react';

// --- CẤU HÌNH ---
const API_URL = "https://script.google.com/macros/s/AKfycbz..."; 
const QUESTIONS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzAJgPL7HRlqiDRjj_8-cmY0NhuPkonAZSIGToSREQcpZVrDCvXTXLSz3stZzSzds0_GsVp8hKbMA0/pub?gid=0&single=true&output=csv"; 
const ALLOWED_USERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzAJgPL7HRlqiDRjj_8-cmY0NhuPkonAZSIGToSREQcpZVrDCvXTXLSz3stZzSzds0_GsVp8hKbMA0/pub?gid=1298018390&single=true&output=csv"; 

// --- HELPER: PHÁO GIẤY ---
const FireworkEffect = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981'];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2, y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
        size: Math.random() * 5 + 2, color: colors[Math.floor(Math.random() * colors.length)],
        life: 100
      });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life--; p.vy += 0.2;
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      if (particles.some(p => p.life > 0)) requestAnimationFrame(animate);
    };
    animate();
  }, []);
  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-50" />;
};

// --- XỬ LÝ CSV ---
const parseCSV = (text) => text.split('\n').map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')));

const parseQuestions = (rows) => {
  const dataRows = rows.slice(1);
  const parsedData = [];
  dataRows.forEach((col, index) => {
    if (!col[1] || col[1].toString().trim() === "") return;
    const options = [col[3], col[4], col[5], col[6], col[7], col[8]].map(opt => opt ? opt.toString().trim() : "").filter(opt => opt !== "");
    const rawCol2 = col[2]; 
    let rawAns = rawCol2 ? rawCol2.toString().toLowerCase().trim() : '';
    const cleanAns = rawAns.replace(/[^a-z0-9]/g, '');
    let finalIndex = -1;
    const charMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5 };
    if (charMap.hasOwnProperty(cleanAns)) finalIndex = charMap[cleanAns];
    else { const num = parseInt(cleanAns); if (!isNaN(num) && num > 0) finalIndex = num - 1; }
    parsedData.push({ id: parsedData.length + 1, question: col[1], options: options, correctIndex: finalIndex });
  });
  return parsedData;
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

// --- COMPONENT THẺ CÂU HỎI ---
const QuestionCard = ({ item, index, mode = 'view', selectedOption = null, onSelectOption = () => {}, showResultImmediately = false }) => {
  const [isRevealed, setIsRevealed] = useState(showResultImmediately);
  useEffect(() => { if (!showResultImmediately) setIsRevealed(false); }, [item, showResultImmediately]);

  return (
    <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 animate-fade-in relative transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 leading-relaxed">
          <span className="inline-block bg-gradient-to-r from-blue-600 to-violet-600 text-transparent bg-clip-text mr-2">Câu {item.id}:</span>
          {item.question}
        </h3>
      </div>
      <div className="space-y-3">
        {item.options.map((opt, idx) => {
          if (!opt) return null;
          
          if (mode === 'search' && idx !== item.correctIndex) return null;

          let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center cursor-pointer group ";
          
          if (mode === 'search') {
             btnClass += "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-medium shadow-sm";
          } 
          else if (mode === 'exam_taking') {
            btnClass += selectedOption === idx 
              ? "bg-blue-50 dark:bg-blue-900/40 border-blue-500 text-blue-900 dark:text-blue-100" 
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-gray-600 dark:text-gray-300";
          } else if (isRevealed) {
            if (idx === item.correctIndex) btnClass += "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-medium";
            else if (mode === 'exam_result' && idx === selectedOption) btnClass += "bg-red-50 dark:bg-red-900/40 border-red-500 text-red-900 dark:text-red-100 opacity-80";
            else btnClass += "bg-gray-50 dark:bg-gray-800/50 border-transparent text-gray-400 dark:text-gray-600 opacity-50";
          } else {
            btnClass += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300";
          }
          
          return (
            <div key={idx} className={btnClass} onClick={() => (mode === 'exam_taking' ? onSelectOption(idx) : null)}>
              <span className={`w-8 h-8 flex items-center justify-center mr-4 text-sm font-bold rounded-full transition-colors ${
                 mode === 'search' 
                 ? 'bg-emerald-500 text-white' 
                 : (mode === 'exam_taking' && selectedOption === idx) || (isRevealed && idx === item.correctIndex)
                 ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg' 
                 : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
              }`}>
                {mode === 'search' ? <Check size={16}/> : String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{opt}</span>
            </div>
          );
        })}
      </div>
      
      {mode === 'view' && !showResultImmediately && (
        <div className="mt-6 flex justify-end">
          <button onClick={() => setIsRevealed(true)} disabled={isRevealed} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg transform active:scale-95 ${
              isRevealed ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-default shadow-none" 
              : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-blue-500/30"
            }`}>
            <CheckCircle size={18} /> {isRevealed ? "Đã hiện đáp án" : "Xem đáp án"}
          </button>
        </div>
      )}
    </div>
  );
};

// --- APP CHÍNH ---
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [inputEmail, setInputEmail] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [view, setView] = useState('review'); 
  const [dataLoading, setDataLoading] = useState(false);
  const [fullData, setFullData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [reviewStatus, setReviewStatus] = useState('menu'); 
  const [reviewQueue, setReviewQueue] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [selectedReviewAns, setSelectedReviewAns] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState(null); 
  const [showConfetti, setShowConfetti] = useState(false);
  
  // State mới: Index bắt đầu tùy chỉnh
  const [customStartIndex, setCustomStartIndex] = useState(1);

  const [examStatus, setExamStatus] = useState('intro'); 
  const [examQuestions, setExamQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const timerRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const savedUser = localStorage.getItem('qa_app_user');
    if (savedUser) { setCurrentUser(savedUser); fetchQuestions(); }
  }, []);

  useEffect(() => {
    if (examStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => { if (prev <= 1) { handleSubmitExam(); return 0; } return prev - 1; });
      }, 1000);
    } else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [examStatus]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const fetchQuestions = async () => {
    setDataLoading(true);
    try {
      const response = await fetch(`${QUESTIONS_CSV_URL}&t=${Date.now()}`);
      if (!response.ok) throw new Error("Lỗi tải CSV");
      const text = await response.text();
      const rows = parseCSV(text);
      const parsedData = parseQuestions(rows);
      setFullData(parsedData);
    } catch (err) { alert("Lỗi tải dữ liệu: " + err.message); } 
    finally { setDataLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const response = await fetch(`${ALLOWED_USERS_CSV_URL}&t=${Date.now()}`);
      if (!response.ok) throw new Error("Lỗi kết nối");
      const text = await response.text();
      const allowedEmails = parseAllowedUsers(parseCSV(text));
      const email = inputEmail.toLowerCase().trim();
      if (allowedEmails.includes(email)) {
        setCurrentUser(email); localStorage.setItem('qa_app_user', email); fetchQuestions();
      } else { setLoginError('Email không có quyền truy cập'); }
    } catch (err) { setLoginError('Lỗi: ' + err.message); } 
    finally { setIsLoggingIn(false); }
  };

  // Cập nhật hàm startReview để hỗ trợ chọn câu bắt đầu
  const startReview = (mode, startIndex = 0) => {
    if (fullData.length === 0) return;
    const queue = mode === 'random' ? shuffleArray([...fullData]) : [...fullData];
    setReviewQueue(queue); 
    
    // Logic xác định vị trí bắt đầu
    let finalIndex = 0;
    if (mode === 'sequential') {
        if (startIndex >= 0 && startIndex < queue.length) {
            finalIndex = startIndex;
        }
    }

    setCurrentReviewIndex(finalIndex); 
    setSelectedReviewAns(null); 
    setReviewFeedback(null); 
    setReviewStatus('playing');
  };

  // Hàm mới: Quay lại câu trước
  const handlePrevReviewQuestion = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(prev => prev - 1);
      setSelectedReviewAns(null); 
      setReviewFeedback(null); 
      setShowConfetti(false);
    }
  };

  const handleCheckReviewAnswer = () => {
    if (selectedReviewAns === null) return;
    const currentQ = reviewQueue[currentReviewIndex];
    if (selectedReviewAns === currentQ.correctIndex) {
      setReviewFeedback('correct'); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000);
    } else { setReviewFeedback('incorrect'); }
  };

  const handleNextReviewQuestion = () => {
    if (currentReviewIndex < reviewQueue.length - 1) {
      setCurrentReviewIndex(prev => prev + 1); setSelectedReviewAns(null); setReviewFeedback(null); setShowConfetti(false);
    } else { alert("Bạn đã hoàn thành hết câu hỏi!"); setReviewStatus('menu'); }
  };

  const handleStartExam = () => {
    if (fullData.length === 0) return;
    const selected = shuffleArray([...fullData]).slice(0, 20);
    setExamQuestions(selected); setUserAnswers({}); setTimeLeft(30 * 60); setExamStatus('playing'); window.scrollTo(0, 0);
  };
  const handleSubmitExam = () => { setExamStatus('finished'); window.scrollTo(0, 0); };
  const calculateScore = () => { let count = 0; examQuestions.forEach(q => { if (userAnswers[q.id] === q.correctIndex) count++; }); return count; };
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return fullData.filter(item => item.question.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, fullData]);

  if (!currentUser) return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans transition-colors duration-300 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-violet-600"></div>
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 p-5 rounded-full shadow-inner">
            <ShieldCheck className="text-blue-600 dark:text-blue-400" size={40} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-2">Q&A Master</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">Đăng nhập để bắt đầu hành trình</p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input type="email" required placeholder="name@company.com" value={inputEmail} onChange={e => setInputEmail(e.target.value)} 
              className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          {loginError && <div className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={16}/> {loginError}</div>}
          <button type="submit" disabled={isLoggingIn} 
            className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 disabled:opacity-70">
            {isLoggingIn ? "Đang xác thực..." : "Truy cập ngay"}
          </button>
        </form>
        <button onClick={toggleTheme} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {showConfetti && <FireworkEffect />}
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-violet-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/30">
              <Zap size={24} fill="currentColor" />
            </div>
            <span className="font-bold text-2xl tracking-tight hidden sm:block">Q&A<span className="text-blue-600 dark:text-blue-400">Master</span></span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => { fetchQuestions(); setReviewStatus('menu'); }} className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors" title="Cập nhật đề">
              <RefreshCw size={20} className={dataLoading ? "animate-spin" : ""} />
            </button>
            <button onClick={toggleTheme} className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700">
               <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                 {currentUser.charAt(0).toUpperCase()}
               </div>
               <span className="text-sm font-medium truncate max-w-[100px] hidden sm:block">{currentUser.split('@')[0]}</span>
            </div>
            <button onClick={() => {localStorage.removeItem('qa_app_user'); setCurrentUser(null);}} className="text-gray-400 hover:text-red-500 transition-colors"><LogOut size={22}/></button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-20 z-20">
        <div className="max-w-6xl mx-auto px-4 flex justify-center sm:justify-start gap-8">
          {[
            { id: 'review', label: 'Ôn tập', icon: HelpCircle },
            { id: 'search', label: 'Tra cứu', icon: Search },
            { id: 'exam', label: 'Thi thử', icon: Clock }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setView(tab.id)} 
              className={`py-4 px-2 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                view === tab.id 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10 min-h-[calc(100vh-180px)]">
        {dataLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-pulse">
            <RefreshCw className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="font-medium">Đang đồng bộ dữ liệu...</p>
          </div>
        )}
        
        {!dataLoading && view === 'review' && (
          <div className="animate-fade-in">
            {reviewStatus === 'menu' ? (
              <div className="text-center py-10">
                <div className="inline-block p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6">
                  <LayoutGrid size={48} />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Chế độ Ôn tập</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto">Luyện tập kiến thức của bạn theo cách bạn muốn.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {/* CARD NGẪU NHIÊN */}
                  <button onClick={() => startReview('random')} 
                    className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all group text-left h-full">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600 dark:text-blue-400">
                      <RefreshCw size={28} />
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-gray-800 dark:text-white">Ngẫu nhiên</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hệ thống sẽ trộn câu hỏi để bạn phản xạ nhanh hơn.</p>
                  </button>

                  {/* CARD LẦN LƯỢT (CUSTOM INPUT) */}
                  <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 hover:border-violet-500 hover:shadow-xl hover:shadow-violet-500/10 transition-all group flex flex-col h-full relative overflow-hidden">
                    <div className="flex-1">
                      <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-violet-600 group-hover:text-white transition-colors text-violet-600 dark:text-violet-400">
                        <ArrowRight size={28} />
                      </div>
                      <h3 className="font-bold text-xl mb-2 text-gray-800 dark:text-white">Lần lượt</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Ôn từ đầu hoặc chọn câu bắt đầu.</p>
                    </div>
                    <div className="mt-auto bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Bắt đầu từ câu số:</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          min="1" 
                          max={fullData.length}
                          value={customStartIndex}
                          onChange={(e) => setCustomStartIndex(Number(e.target.value))}
                          className="w-20 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-center font-bold focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                        <div className="flex items-center text-gray-400 text-sm font-medium mr-2">/ {fullData.length}</div>
                        <button 
                          onClick={() => startReview('sequential', customStartIndex - 1)}
                          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl py-2 transition-colors flex items-center justify-center gap-1 shadow-lg shadow-violet-500/30"
                        >
                          Đi <ArrowRight size={16}/>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setReviewStatus('menu')} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex items-center font-medium transition-colors"><ChevronLeft size={20}/> Menu</button>
                  <div className="text-sm font-bold bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    Câu {currentReviewIndex + 1} / {reviewQueue.length}
                  </div>
                </div>

                <div className={`relative p-1 rounded-3xl bg-gradient-to-b ${reviewFeedback === 'correct' ? 'from-emerald-400 to-emerald-600' : reviewFeedback === 'incorrect' ? 'from-red-400 to-red-600' : 'from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900'} transition-all duration-500 ${reviewFeedback === 'incorrect' ? 'animate-shake' : ''}`}>
                  <div className="bg-white dark:bg-gray-900 rounded-[22px] p-6 sm:p-8 relative overflow-hidden">
                    {reviewFeedback === 'correct' && <div className="absolute top-4 right-4 animate-bounce"><div className="bg-emerald-100 text-emerald-600 p-3 rounded-full"><Smile size={32}/></div></div>}
                    {reviewFeedback === 'incorrect' && <div className="absolute top-4 right-4 animate-bounce"><div className="bg-red-100 text-red-600 p-3 rounded-full"><Frown size={32}/></div></div>}

                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8 leading-snug pr-12">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 mr-2">Q.</span>
                      {reviewQueue[currentReviewIndex].question}
                    </h3>

                    <div className="space-y-3">
                      {reviewQueue[currentReviewIndex].options.map((opt, idx) => {
                        let btnClass = "w-full text-left p-5 rounded-xl border-2 transition-all flex items-center cursor-pointer relative ";
                        if (reviewFeedback) {
                          if (idx === reviewQueue[currentReviewIndex].correctIndex) btnClass += "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold";
                          else if (idx === selectedReviewAns && reviewFeedback === 'incorrect') btnClass += "bg-red-50 dark:bg-red-900/30 border-red-500 text-red-900 dark:text-red-100 opacity-80";
                          else btnClass += "bg-gray-50 dark:bg-gray-800/50 border-transparent text-gray-400 dark:text-gray-600 opacity-50";
                        } else {
                          if (selectedReviewAns === idx) btnClass += "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-900 dark:text-blue-100 shadow-md transform scale-[1.01]";
                          else btnClass += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300";
                        }
                        return (
                          <div key={idx} onClick={() => !reviewFeedback && setSelectedReviewAns(idx)} className={btnClass}>
                            <span className={`w-8 h-8 flex items-center justify-center mr-4 text-sm font-bold rounded-full ${selectedReviewAns === idx || (reviewFeedback && idx === reviewQueue[currentReviewIndex].correctIndex) ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>{String.fromCharCode(65 + idx)}</span>
                            <span className="flex-1">{opt}</span>
                            {reviewFeedback === 'correct' && idx === reviewQueue[currentReviewIndex].correctIndex && <PartyPopper className="text-emerald-500 animate-pulse ml-2" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center items-center gap-4">
                  {/* Nút quay lại */}
                  <button 
                    onClick={handlePrevReviewQuestion} 
                    disabled={currentReviewIndex === 0}
                    className={`px-6 py-4 rounded-full font-bold text-lg flex items-center gap-2 transition-all transform active:scale-95 border-2 ${
                      currentReviewIndex === 0
                      ? "bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400"
                    }`}
                  >
                    <ChevronLeft size={22}/> <span className="hidden sm:inline">Trước</span>
                  </button>

                  {!reviewFeedback ? (
                    <button onClick={handleCheckReviewAnswer} disabled={selectedReviewAns === null}
                      className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-8 sm:px-12 py-4 rounded-full font-bold text-lg shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex-1 sm:flex-none">
                      Trả lời
                    </button>
                  ) : (
                    <button onClick={handleNextReviewQuestion} className="bg-gray-800 dark:bg-white text-white dark:text-gray-900 px-8 sm:px-12 py-4 rounded-full font-bold text-lg hover:shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 flex-1 sm:flex-none">
                      Tiếp theo <ArrowRight size={22}/>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: TRA CỨU --- */}
        {!dataLoading && view === 'search' && (
          <div className="animate-fade-in max-w-3xl mx-auto">
            <div className="relative mb-8 group">
              <input type="text" placeholder="Nhập từ khóa để tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full p-5 pl-14 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-lg text-gray-800 dark:text-white" />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            </div>
            {searchTerm ? (
              searchResults.length > 0 ? searchResults.map((item, index) => <QuestionCard key={item.id} item={item} index={index} showResultImmediately={true} mode="search" />)
              : <div className="text-center py-10 text-gray-400">Không tìm thấy kết quả nào</div>
            ) : (
              <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl"><Search className="mx-auto mb-4 opacity-20" size={64} /><p className="text-lg">Nhập từ khóa để bắt đầu tra cứu</p></div>
            )}
          </div>
        )}

        {/* --- VIEW: THI THỬ --- */}
        {!dataLoading && view === 'exam' && (
          <div className="animate-fade-in">
            {examStatus === 'intro' && (
              <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-3xl shadow-2xl text-center max-w-2xl mx-auto border border-gray-100 dark:border-gray-800">
                <div className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Award className="text-orange-500" size={48} />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Sẵn sàng thử thách?</h2>
                <div className="text-left text-gray-600 dark:text-gray-300 mb-10 space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl">
                  <div className="flex items-center gap-4"><div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600"><CheckCircle size={20}/></div><span className="font-medium">20 câu hỏi ngẫu nhiên</span></div>
                  <div className="flex items-center gap-4"><div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600"><Clock size={20}/></div><span className="font-medium">Thời gian: 30 phút</span></div>
                </div>
                <button onClick={handleStartExam} className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-10 py-4 rounded-full font-bold text-xl shadow-xl shadow-blue-500/30 hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                  <Play size={24} fill="currentColor" /> Bắt đầu ngay
                </button>
              </div>
            )}
            {examStatus === 'playing' && (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-lg mb-8 sticky top-24 z-10 flex justify-between items-center border border-gray-100 dark:border-gray-800 backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
                  <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 font-bold text-xl font-mono bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-xl">
                    <Clock className="animate-pulse" /> {formatTime(timeLeft)}
                  </div>
                  <button onClick={() => { if(window.confirm('Nộp bài sớm?')) handleSubmitExam(); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all">Nộp bài</button>
                </div>
                <div className="space-y-8">
                  {examQuestions.map((item, index) => <QuestionCard key={item.id} item={item} index={index} mode="exam_taking" selectedOption={userAnswers[item.id]} onSelectOption={(optIdx) => setUserAnswers(prev => ({...prev, [item.id]: optIdx}))} />)}
                </div>
                <div className="mt-12 text-center"><button onClick={handleSubmitExam} className="bg-emerald-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-emerald-700 shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all">Hoàn thành bài thi</button></div>
              </div>
            )}
            {examStatus === 'finished' && (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl mb-10 text-center border border-gray-100 dark:border-gray-800">
                  <h2 className="text-2xl text-slate-500 dark:text-slate-400 font-medium mb-4">Kết quả chung cuộc</h2>
                  <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 mb-6">{calculateScore()} <span className="text-3xl text-slate-300 font-normal">/ 20</span></div>
                  <button onClick={handleStartExam} className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"><RotateCcw size={20} /> Thử sức lại</button>
                </div>
                <div className="space-y-8">
                  {examQuestions.map((item, index) => <QuestionCard key={item.id} item={item} index={index} mode="exam_result" selectedOption={userAnswers[item.id]} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}