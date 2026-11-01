
import { useEffect, useState } from "react";

const API = "http://localhost:5000";

function Subscription({ onBack }) {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadSubscription() {
            const token = sessionStorage.getItem("token");

            if (!token) {
                setMessage("Please log in to view your subscription.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API}/api/subscription`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json"
                    }
                });

                const contentType = response.headers.get("content-type") || "";

                if (!contentType.includes("application/json")) {
                    throw new Error(
                        "The backend returned HTML instead of JSON. Please check the backend server and subscription route."
                    );
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Could not load subscription."
                    );
                }

                if (!cancelled) {
                    setSubscription(data);
                    setMessage("");
                }
            } catch (error) {
                if (!cancelled) {
                    setMessage(error.message || "Could not load subscription.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadSubscription();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="dashboard-page">
            <header>
                <h1>Unfazed</h1>
                <button onClick={onBack}>← Dashboard</button>
            </header>

            <main>
                <h2>My Subscription</h2>

                {loading ? (
                    <div className="feature-card">
                        <p>Loading subscription...</p>
                    </div>
                ) : subscription ? (
                    <div className="feature-card">
                        <h3>Unfazed Free Plan</h3>

                        <p>
                            Plan: <strong>{subscription.plan}</strong>
                        </p>

                        <p>
                            Status: <strong>{subscription.status}</strong>
                        </p>

                        <p>
                            Start Date:{" "}
                            {subscription.startDate
                                ? new Date(
                                    subscription.startDate
                                ).toLocaleDateString()
                                : "Not available"}
                        </p>

                        <p>You are currently using the Free Plan.</p>
                    </div>
                ) : (
                    <div className="feature-card">
                        <p role="alert">{message}</p>
                        <button onClick={() => window.location.reload()}>
                            Try Again
                        </button>
                    </div>
                )}

                <div className="feature-card">
                    <p>
                        Demonstration subscription only. No payments or
                        upgrades are available.
                    </p>
                </div>

                <button onClick={onBack}>Back to Dashboard</button>
            </main>
        </div>
    );
}

export default Subscription;
