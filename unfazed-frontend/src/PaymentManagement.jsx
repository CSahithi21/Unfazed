
import { useEffect, useState } from "react";

const API = "http://localhost:5000";

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "Server response error." };
  }
}

function PaymentManagement({ onBack }) {
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = sessionStorage.getItem("token");

  async function loadData() {
    setLoading(true);

    try {
      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [clientResponse, paymentResponse] = await Promise.all([
        fetch(`${API}/api/clients`, { headers }),
        fetch(`${API}/api/payments`, { headers })
      ]);

      const clientData = await readResponse(clientResponse);
      const paymentData = await readResponse(paymentResponse);

      if (!clientResponse.ok) {
        throw new Error(clientData.message || "Could not load clients.");
      }

      if (!paymentResponse.ok) {
        throw new Error(paymentData.message || "Could not load payments.");
      }

      setClients(clientData);
      setPayments(paymentData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createPayment(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const paymentData = {
      clientId: formData.get("clientId"),
      amount: Number(formData.get("amount")),
      packageName: formData.get("packageName").trim()
    };

    if (
      !paymentData.clientId ||
      !Number.isSafeInteger(paymentData.amount) ||
      paymentData.amount < 1 ||
      paymentData.amount > 100000
    ) {
      setMessage("Please select a client and enter a valid amount.");
      return;
    }

    if (!window.Razorpay) {
      setMessage("Razorpay checkout did not load. Please refresh.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const orderResponse = await fetch(
        `${API}/api/payments/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(paymentData)
        }
      );

      const order = await readResponse(orderResponse);

      if (!orderResponse.ok) {
        throw new Error(order.message || "Could not create payment order.");
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Unfazed",
        description: paymentData.packageName,
        order_id: order.orderId,

        handler: async function (checkoutResponse) {
          try {
            setLoading(true);

            const verifyResponse = await fetch(
              `${API}/api/payments/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(checkoutResponse)
              }
            );

            const verification = await readResponse(verifyResponse);

            if (!verifyResponse.ok) {
              throw new Error(
                verification.message || "Payment verification failed."
              );
            }

            setMessage(verification.message || "Payment verification completed.");
            form.reset();
            await loadData();
          } catch (error) {
            setMessage(error.message);
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setMessage("Checkout closed. Payment remains pending.");
            setLoading(false);
          }
        },

        theme: {
          color: "#426b57"
        }
      });

      checkout.on("payment.failed", function (response) {
        setMessage(
          response.error?.description || "Test payment was not completed."
        );
        setLoading(false);
      });

      setLoading(false);
      checkout.open();

    } catch (error) {
      setMessage(error.message || "Could not start checkout.");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalAmount = payments
    .filter(payment => payment.status === "paid")
    .reduce((total, payment) => total + payment.amount, 0);

  return (
    <div className="dashboard-page">
      <header>
        <h1>Unfazed</h1>
        <button onClick={onBack}>← Dashboard</button>
      </header>

      <main>
        <h2>Payment Management</h2>
        <p>Create and review client payment records.</p>

        <div className="feature-card">
          <h3>Total Recorded Payments</h3>
          <h2>₹{totalAmount.toLocaleString("en-IN")}</h2>
          <p>Only confirmed paid records are included.</p>
        </div>

        <div className="feature-card">
          <h3>Razorpay Test Checkout</h3>

          {clients.length === 0 ? (
            <p>Add a client before creating a payment.</p>
          ) : (
            <form onSubmit={createPayment}>
              <label>Select Client</label>
              <select name="clientId" required defaultValue="">
                <option value="" disabled>Choose a client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>

              <label>Package Name</label>
              <input
                name="packageName"
                defaultValue="Single Session"
                required
              />

              <label>Amount (INR)</label>
              <input
                type="number"
                name="amount"
                min="1"
                max="100000"
                step="1"
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Please wait..." : "Open Test Checkout"}
              </button>
            </form>
          )}
        </div>

        {message && <p role="status">{message}</p>}

        <h2>Payment History ({payments.length})</h2>

        {payments.length === 0 ? (
          <p>No payment records yet.</p>
        ) : (
          payments.map(payment => (
            <div className="feature-card" key={payment._id}>
              <h3>{payment.packageName}</h3>
              <p>Client: {payment.client?.name || "Unknown client"}</p>
              <p>Amount: ₹{Number(payment.amount).toLocaleString("en-IN")}</p>
              <p>Status: {payment.status.toUpperCase()}</p>
              <p>
                Created: {new Date(payment.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          ))
        )}

        <button onClick={onBack}>Back to Dashboard</button>
      </main>
    </div>
  );
}

export default PaymentManagement;
