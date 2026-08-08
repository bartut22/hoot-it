import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ReferralLink() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem("owlquest_pending_ref", code);
    }
    navigate("/", { replace: true });
  }, [code, navigate]);

  return null;
}