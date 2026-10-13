import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLoader } from "@/hooks/useLoader";
import { usePayment } from "@/hooks/usePayment";
import { paymentService } from "@/services/payment";

export function usePaymentAvailability() {
  const navigate = useNavigate();
  const location = useLocation();

  const { fetchWithLoader } = useLoader();
  const { checkPaymentState, setPaymentState } = usePayment();
  const token = location.hash.slice(1);
  const statePayment = location.state?.payment;

  // Все сайд-эффекты (запрос, setState, навигация) выполняются в useEffect,
  // а не во время рендера.
  useEffect(() => {
    if (!token) {
      navigate({ pathname: "main", search: location.search });
      return;
    }

    if (statePayment) {
      setPaymentState(JSON.parse(statePayment));
      return;
    }

    const cb = async () => {
      const response = await paymentService().state(token);

      setPaymentState(response);
      await checkPaymentState(response, token);
    };

    fetchWithLoader(cb, true);
  }, [
    token,
    statePayment,
    location.search,
    navigate,
    setPaymentState,
    checkPaymentState,
    fetchWithLoader,
  ]);
}
