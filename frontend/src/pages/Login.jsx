import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [timer, setTimer] = useState(0);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ text: 'Ingresa un correo electrónico válido', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/send-code', { email });
      if (res.data.success) {
        setStep('otp');
        setMessage({ text: 'Código enviado a tu correo', type: 'success' });
        startTimer(60);
      } else {
        setMessage({ text: res.data.error || 'Error al enviar código', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ text: 'Error de conexión con el servidor', type: 'error' });
    }
    setLoading(false);
  };

  const startTimer = (seconds) => {
    setTimer(seconds);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyCode = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setMessage({ text: 'Ingresa el código de 6 dígitos', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-code', { email, code });
      if (res.data.success) {
        localStorage.setItem('auth_token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setMessage({ text: 'Acceso concedido. Redirigiendo...', type: 'success' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setMessage({ text: res.data.error || 'Código incorrecto', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ text: 'Error de verificación', type: 'error' });
    }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleResendCode = () => {
    if (timer > 0) return;
    handleSendCode({ preventDefault: () => {} });
  };

  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Talent Pipeline</h2>
          <p className="text-white/70 mt-1">Sistema inteligente de reclutamiento</p>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/30">
          
          {step === 'email' && (
            <form onSubmit={handleSendCode}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="tu@empresa.com"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Enviando...
                  </span>
                ) : (
                  'Enviar código de acceso'
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mt-4">
                Te enviaremos un código de 6 dígitos a tu correo
              </p>
            </form>
          )}

          {step === 'otp' && (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Código de verificación
                </label>
                <div className="flex justify-center gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">
                  {timer > 0 ? (
                    <span>⏱️ Reenviar código en {timer} segundos</span>
                  ) : (
                    <button
                      onClick={handleResendCode}
                      className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none cursor-pointer"
                    >
                      🔄 Reenviar código
                    </button>
                  )}
                </p>
              </div>
              <button
                onClick={handleVerifyCode}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Verificando...
                  </span>
                ) : (
                  'Verificar acceso'
                )}
              </button>
              <button
                onClick={() => {
                  setStep('email');
                  setOtp(['', '', '', '', '', '']);
                  setMessage({ text: '', type: '' });
                }}
                className="w-full mt-3 text-gray-500 py-2 rounded-xl text-sm hover:text-gray-700 transition bg-transparent border-none cursor-pointer"
              >
                ← Usar otro correo
              </button>
            </div>
          )}

          {message.text && (
            <div className={`mt-4 p-3 rounded-xl text-center text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        <p className="text-center text-white/50 text-xs mt-8">
          Sistema seguro · Acceso mediante código de un solo uso
        </p>
      </div>
    </div>
  );
};

export default Login;
