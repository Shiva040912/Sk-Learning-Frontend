import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiMail, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";

import api from "../services/axios";
import "../styles/login.css";
import logo from "../assets/sk-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsLoggingIn(true);
      const response = await api.post("/auth/login", formData);
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success("Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Login failed. Please check credentials.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell" aria-labelledby="login-title">
        <header className="login-brand">
          <div className="login-logo-wrap">
            <img src={logo} alt="The SK Learnings" />
          </div>
          <div>
            <h1>THE SK LEARNINGS</h1>
<p>Private Educational Services</p>
            <div className="login-courses">
              Medical <i>/</i> Engineering <i>/</i> Foundations <i>/</i> Junior IAS
            </div>
          </div>
        </header>

        <div className="login-divider" />

        <div className="login-heading">
          <span>MANAGEMENT PORTAL</span>
          <h2 id="login-title">Welcome back</h2>
          <p>Sign in to manage students, fees and daily operations.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <div className="input-box">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-box">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={isLoggingIn}>
            {isLoggingIn ? (
              <><span className="login-loader" /><span>Signing in...</span></>
            ) : (
              <span>Sign in to dashboard</span>
            )}
          </button>
        </form>

        <footer className="login-security">
          <FiShield />
          <span>Secure access for authorised staff only</span>
        </footer>
      </section>

      <p className="login-copyright">© {new Date().getFullYear()} The SK Learnings</p>
    </main>
  );
};

export default Login;