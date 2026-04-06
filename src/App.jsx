import { useState, useEffect, useRef } from 'react';
import { saveScore, getTopScores } from './supabase.js';
import './App.css';

const GAME_DURATION = 30;
const INITIAL_SPEED = 120;
const SPEED_INCREMENT = 25;
const INITIAL_SIZE = 110;
const SIZE_DECREMENT = 10;
const MIN_SIZE = 34;

export default function App() {
  const [phase, setPhase] = useState('name');
  const [name, setName] = useState('');
  const [clicks, setClicks] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [pos, setPos] = useState({ x: 300, y: 300 });
  const [btnSize, setBtnSize] = useState(INITIAL_SIZE);
  const [topScores, setTopScores] = useState([]);
  const [showTop, setShowTop] = useState(false);

  const ref = useRef({
    vel: { x: INITIAL_SPEED, y: INITIAL_SPEED * 0.65 },
    pos: { x: 300, y: 300 },
    size: INITIAL_SIZE,
    clicks: 0,
    lastTime: null,
  });
  const animRef = useRef(null);
  const timerRef = useRef(null);

  function startGame() {
    if (!name.trim()) return;
    const s = ref.current;
    s.vel = { x: INITIAL_SPEED, y: INITIAL_SPEED * 0.65 };
    s.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    s.size = INITIAL_SIZE;
    s.clicks = 0;
    s.lastTime = null;
    setClicks(0);
    setMisses(0);
    setTimeLeft(GAME_DURATION);
    setBtnSize(INITIAL_SIZE);
    setPos(s.pos);
    setShowTop(false);
    setPhase('playing');
  }

  useEffect(() => {
    if (phase !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          cancelAnimationFrame(animRef.current);
          setPhase('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    function animate(ts) {
      const s = ref.current;
      if (s.lastTime === null) s.lastTime = ts;
      const dt = Math.min((ts - s.lastTime) / 1000, 0.05);
      s.lastTime = ts;

      s.pos.x += s.vel.x * dt;
      s.pos.y += s.vel.y * dt;

      const maxX = window.innerWidth - s.size;
      const maxY = window.innerHeight - s.size;

      if (s.pos.x < 0) { s.pos.x = 0; s.vel.x = Math.abs(s.vel.x); }
      if (s.pos.x > maxX) { s.pos.x = maxX; s.vel.x = -Math.abs(s.vel.x); }
      if (s.pos.y < 0) { s.pos.y = 0; s.vel.y = Math.abs(s.vel.y); }
      if (s.pos.y > maxY) { s.pos.y = maxY; s.vel.y = -Math.abs(s.vel.y); }

      setPos({ x: s.pos.x, y: s.pos.y });
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(animRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'finished') return;
    saveScore(name, clicks).then(() => {
      getTopScores().then(setTopScores);
    });
  }, [phase]);

  function handleClick(e) {
    e.stopPropagation();
    const s = ref.current;
    s.clicks += 1;
    setClicks(s.clicks);

    const speed = INITIAL_SPEED + s.clicks * SPEED_INCREMENT;
    const angle = Math.random() * Math.PI * 2;
    s.vel.x = Math.cos(angle) * speed;
    s.vel.y = Math.sin(angle) * speed;

    if (s.clicks % 5 === 0) {
      s.size = Math.max(s.size - SIZE_DECREMENT, MIN_SIZE);
      setBtnSize(s.size);
    }
  }

  if (phase === 'name') {
    return (
      <div className="screen">
        <h1 className="screen__title">Кликер</h1>
        <p className="screen__sub">Кликни по кнопке как можно больше раз за 30 секунд</p>
        <input
          className="screen__input"
          placeholder="Твоё имя"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && startGame()}
          autoFocus
        />
        <button className="screen__btn" onClick={startGame} disabled={!name.trim()}>
          Играть
        </button>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="screen">
        <h1 className="screen__title">Время вышло!</h1>
        <p className="screen__name">{name}</p>
        <p className="screen__score">{clicks}</p>
        <p className="screen__score-label">кликов</p>

        <button className="screen__btn--secondary" onClick={() => setShowTop(v => !v)}>
          {showTop ? 'Скрыть топ' : 'Топ 10'}
        </button>

        {showTop && (
          <div className="top">
            {topScores.length === 0 && <p className="top__empty">Загрузка...</p>}
            {topScores.map((s, i) => (
              <div key={i} className={`top__row ${s.name === name && s.score === clicks ? 'top__row--me' : ''}`}>
                <span className="top__place">#{i + 1}</span>
                <span className="top__name">{s.name}</span>
                <span className="top__score">{s.score}</span>
              </div>
            ))}
          </div>
        )}

        <button className="screen__btn" onClick={() => setPhase('name')}>
          Ещё раз
        </button>
      </div>
    );
  }

  return (
    <div className="game" onClick={() => setMisses(m => m + 1)}>
      <div className="hud">
        <span className="hud__clicks">{clicks} кликов<br /><span className="hud__misses">{misses} промахов</span></span>
        <span className={`hud__timer ${timeLeft <= 5 ? 'hud__timer--urgent' : ''}`}>
          {timeLeft}с
        </span>
      </div>
      <button
        className="click-btn"
        style={{
          left: pos.x,
          top: pos.y,
          width: btnSize,
          height: btnSize,
          fontSize: Math.max(btnSize * 0.13, 9),
        }}
        onClick={handleClick}
      >
        КЛИК
      </button>
    </div>
  );
}
