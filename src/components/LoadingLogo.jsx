import loadingLogo from "../assets/loading.png";

const LoadingLogo = () => (
  <div className="app-loading-logo" role="status" aria-label="Loading">
    <img src={loadingLogo} alt="" aria-hidden="true" />
    <span className="app-loading-logo-ring" aria-hidden="true" />
  </div>
);

export default LoadingLogo;
