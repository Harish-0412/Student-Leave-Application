import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, X } from 'lucide-react';
import api from '../../services/http';
import './ChatbotWidget.css'; // Add the new loader CSS

const starterPrompts = [
  'Go to Dashboard',
  'Apply for Leave',
  'How do I start my 30-day plan?',
];

function ChatbotLauncher({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close chatbot' : 'Open chatbot'}
      className="fixed bottom-6 right-6 z-50 flex h-20 w-20 items-center justify-center rounded-full border border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl transition-transform hover:scale-[1.03]"
    >
      <div className="loader">
        <div className="box1"></div>
        <div className="box2"></div>
        <div className="box3"></div>
      </div>
    </button>
  );
}

function ChatbotWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi, I am the Schedulr assistant. I can help with onboarding, 30-day planning, leave applications, and rescheduling.',
    },
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const visibleHistory = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.text,
      })),
    [messages],
  );

  const checkNavigation = (text) => {
    const normalized = text.toLowerCase();
    
    if (normalized.includes('dashboard') || normalized.includes('go back')) {
      navigate('/student/dashboard');
      return true;
    }
    
    if (normalized.includes('leave application') || normalized.includes('apply for leave') || normalized.includes('apply leave')) {
      navigate('/leave/apply');
      return true;
    }

    return false;
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    
    // Check if user input itself is a navigation command
    if (checkNavigation(trimmed)) {
      setLoading(true);
      setTimeout(() => {
        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            role: 'assistant',
            text: `Redirecting you to ${trimmed.toLowerCase().includes('dashboard') ? 'Dashboard' : 'Leave Application'}...`,
          },
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: trimmed,
        history: visibleHistory.slice(-6),
        pageContext: window.location.pathname,
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: response.data.reply,
        quickReplies: response.data.quickReplies || [],
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 2,
          role: 'assistant',
          text: 'I could not reach the assistant right now, but I can still guide you: onboarding needs your name, email, and student ID; leave requests need your reason and dates.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-28 right-6 z-50 flex h-[34rem] w-[23rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Schedulr Assistant</p>
                <p className="text-sm text-muted-foreground">
                  Ask about plans, leave, or scheduling
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.text}
                  {message.quickReplies?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.quickReplies.map((quickReply) => (
                        <button
                          key={quickReply}
                          type="button"
                          onClick={() => sendMessage(quickReply)}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition-colors hover:bg-accent"
                        >
                          {quickReply}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/20" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/20 [animation-delay:0.2s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/20 [animation-delay:0.4s]" />
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/70 px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the assistant..."
                className="h-12 flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none ring-0"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <ChatbotLauncher open={open} onClick={() => setOpen((current) => !current)} />
    </>
  );
}

export default ChatbotWidget;
