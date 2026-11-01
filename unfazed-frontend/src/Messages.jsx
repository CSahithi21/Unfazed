
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API = "http://localhost:5000";

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "Server response error." };
  }
}

function Messages() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageStatus, setMessageStatus] = useState("");
  const [socketStatus, setSocketStatus] = useState("Connecting...");
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedClientRef = useRef("");
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    selectedClientRef.current = selectedClient;
  }, [selectedClient]);

  useEffect(() => {
    fetchClients();
  }, []);

  // AUTHENTICATED SOCKET CONNECTION
  useEffect(() => {
    if (!token) {
      setSocketStatus("Login required");
      return;
    }

    const socket = io(API, {
      auth: { token },
    });

    socket.on("connect", () => {
      setSocketStatus("Connected");
    });

    socket.on("disconnect", () => {
      setSocketStatus("Disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket error:", error.message);
      setSocketStatus("Connection failed");
    });

    // RECEIVE REAL-TIME NOTIFICATIONS
    socket.on("new_message", (data) => {
      if (data.clientId !== selectedClientRef.current) {
        setUnreadCount((count) => count + 1);
        setMessageStatus("A new demonstration message arrived.");
        return;
      }

      setMessages((previousMessages) => {
        const exists = previousMessages.some(
          (item) => item._id === data.message._id
        );

        return exists
          ? previousMessages
          : [...previousMessages, data.message];
      });

      setMessageStatus("New message received in real time!");
    });

    return () => socket.disconnect();
  }, [token]);

  async function fetchClients() {
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not load clients.");
      }

      setClients(
        Array.isArray(data) ? data : data.clients || []
      );
    } catch (error) {
      setMessageStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(clientId) {
    if (!clientId) {
      setMessages([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/messages/${encodeURIComponent(clientId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not load messages.");
      }

      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessages([]);
      setMessageStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClientChange(event) {
    const clientId = event.target.value;

    setSelectedClient(clientId);
    selectedClientRef.current = clientId;
    setMessages([]);
    setMessageStatus("");
    setUnreadCount(0);
    setSearchTerm("");

    if (clientId) {
      await fetchMessages(clientId);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();

    if (!selectedClient || !newMessage.trim()) {
      setMessageStatus("Please select a client and enter a message.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: selectedClient,
          message: newMessage.trim(),
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not send message.");
      }

      setNewMessage("");

      if (data.data) {
        setMessages((previousMessages) => {
          const exists = previousMessages.some(
            (item) => item._id === data.data._id
          );

          return exists
            ? previousMessages
            : [...previousMessages, data.data];
        });
      }

      setMessageStatus("Demo message saved successfully!");
    } catch (error) {
      setMessageStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredMessages = messages.filter((item) =>
    (item.message || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Messages</h2>

      <p>
        Socket.IO: <strong>{socketStatus}</strong>
      </p>

      <div style={{
        background: "#e8f4ff",
        padding: "12px",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <strong>Unread notifications: {unreadCount}</strong>

        <button
          type="button"
          onClick={() => setUnreadCount(0)}
          disabled={unreadCount === 0}
        >
          Clear Notifications
        </button>
      </div>

      <p style={{
        background: "#fff4d6",
        padding: "12px",
        borderRadius: "8px"
      }}>
        Demo mode only. Use fictional client records and messages.
        Client replies are not supported.
      </p>

      <label htmlFor="messageClient">Select Client</label>

      <select
        id="messageClient"
        value={selectedClient}
        onChange={handleClientChange}
        style={{
          display: "block",
          padding: "10px",
          margin: "10px 0",
          width: "100%",
          maxWidth: "400px"
        }}
      >
        <option value="">Choose a client</option>

        {clients.map((client) => (
          <option key={client._id} value={client._id}>
            {client.name}
          </option>
        ))}
      </select>

      {loading && <p>Loading...</p>}

      {selectedClient && (
        <>
          <h3>Message History</h3>

          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "12px",
              boxSizing: "border-box"
            }}
          />

          <div style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "15px",
            minHeight: "150px",
            marginBottom: "15px"
          }}>
            {!loading && filteredMessages.length === 0 && (
              <p>
                {searchTerm
                  ? "No matching messages found."
                  : "No messages yet."}
              </p>
            )}

            {filteredMessages.map((item) => (
              <div
                key={item._id}
                style={{
                  background: "#e8f4ff",
                  padding: "10px",
                  borderRadius: "8px",
                  marginBottom: "10px"
                }}
              >
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {item.message}
                </p>

                <small>
                  Therapist · {
                    item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "Date unavailable"
                  }
                </small>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage}>
            <label htmlFor="newMessage">
              Write a demonstration message
            </label>

            <textarea
              id="newMessage"
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Type your demo message..."
              maxLength={2000}
              rows={4}
              style={{
                width: "100%",
                padding: "10px",
                margin: "10px 0",
                boxSizing: "border-box"
              }}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Save Message"}
            </button>
          </form>
        </>
      )}

      {messageStatus && (
        <p role="status">{messageStatus}</p>
      )}

      {!loading && clients.length === 0 && (
        <p>No demo clients available. Add a fictional demo client first.</p>
      )}
    </div>
  );
}

export default Messages;
