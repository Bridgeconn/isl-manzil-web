import Session from "supertokens-web-js/recipe/session";
import { useNavigate } from "react-router-dom";

const PendingApproval = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await Session.signOut();
    const email = localStorage.getItem("userEmail");
    if (email) {
      console.log("Signing out user with email:", email);
      localStorage.removeItem("userEmail");
    }
    navigate("/auth");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="text-yellow-500 text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Account Pending Approval
        </h1>
        <p className="text-gray-600 mb-6">
          Your account has been created successfully, but it needs to be
          approved by an administrator before you can access the application.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>What's next?</strong>
            <br />
            Please contact your administrator to request access. Once approved,
            you'll be able to use all features of the application after signing
            in.
          </p>
        </div>
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleSignOut}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
