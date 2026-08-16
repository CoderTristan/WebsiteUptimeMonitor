import './App.css';
import { useEffect, useState } from 'react';
import { 
  getHealthCheck, 
  getMe, 
  logout, 
  getMonitors, 
  createMonitor, 
  pingMonitor,
  type Monitor 
} from './api';
import { Activity, LogOut, Plus, Globe, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import AuthForm from './components/AuthForm';

interface User {
  username: string;
}

function App() {
  const [status, setStatus] = useState<string>('Connecting...');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New monitor state
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [newMonitorName, setNewMonitorName] = useState('');
  const [newMonitorUrl, setNewMonitorUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUserMonitors = async () => {
    try {
      const data = await getMonitors();
      setMonitors(data);
    } catch (error) {
      console.error("Failed to fetch monitors", error);
    }
  };

  const checkAuth = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      await fetchUserMonitors(); // Fetch monitors immediately after verifying user
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getHealthCheck()
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('Backend Offline'));
      
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setMonitors([]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonitorName || !newMonitorUrl) return;

    setIsSubmitting(true);
    try {
      // Basic URL validation fallback if the user forgets http://
      const formattedUrl = newMonitorUrl.startsWith('http') 
        ? newMonitorUrl 
        : `https://${newMonitorUrl}`;

      await createMonitor(newMonitorName, formattedUrl);
      setNewMonitorName('');
      setNewMonitorUrl('');
      await fetchUserMonitors(); // Refresh the list
    } catch (error) {
      console.error("Error creating monitor", error);
      alert("Failed to create monitor. Ensure the URL is valid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePing = async (id: number) => {
    try {
      await pingMonitor(id);
      // Wait 1.5 seconds for the backend background task to finish, then refresh
      setTimeout(() => {
        fetchUserMonitors();
      }, 1500);
    } catch (error) {
      console.error("Failed to ping monitor", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 py-10 gap-6">
      {!user ? (
        <AuthForm onLoginSuccess={checkAuth} />
      ) : (
        <div className="w-full max-w-4xl flex flex-col gap-6">
          
          {/* Header & Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-sm">Logged in as</p>
                <p className="font-bold text-xl">{user.username}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>

            <div className="flex items-center gap-4 bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <Activity className={`h-8 w-8 ${status === 'healthy' ? 'text-green-400' : 'text-red-400'}`} />
              <div>
                <h1 className="text-xl font-bold">API Status</h1>
                <p className="text-slate-400">Backend: <span className="font-semibold text-white">{status}</span></p>
              </div>
            </div>
          </div>

          {/* Add Monitor Form */}
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-400" />
              Add New Monitor
            </h2>
            <form onSubmit={handleCreateMonitor} className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Name (e.g. My Portfolio)"
                value={newMonitorName}
                onChange={(e) => setNewMonitorName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="url"
                placeholder="URL (e.g. https://example.com)"
                value={newMonitorUrl}
                onChange={(e) => setNewMonitorUrl(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                required
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Monitor'}
              </button>
            </form>
          </div>

          {/* Monitors List */}
          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-400" />
                Your Monitored Sites
              </h2>
              <button 
                onClick={fetchUserMonitors}
                className="text-slate-400 hover:text-white transition-colors"
                title="Refresh List"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            
            <div className="divide-y divide-slate-700">
              {monitors.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No monitors added yet. Add your first website above!
                </div>
              ) : (
                monitors.map((monitor) => {
                  // Get the most recent ping (assuming backend returns them in order, or grab the last one)
                  const latestPing = monitor.pings.length > 0 
                    ? monitor.pings[monitor.pings.length - 1] 
                    : null;

                  return (
                    <div key={monitor.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg">{monitor.name}</h3>
                        <a href={monitor.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm">
                          {monitor.url}
                        </a>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {/* Status Display */}
                        <div className="flex items-center gap-2 min-w-[120px]">
                          {!latestPing ? (
                            <span className="text-slate-500 text-sm italic">Never pinged</span>
                          ) : latestPing.is_up ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="text-sm font-bold text-green-500">Up</p>
                                <p className="text-xs text-slate-400">{latestPing.response_time_ms}ms</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-red-500" />
                              <div>
                                <p className="text-sm font-bold text-red-500">Down</p>
                                <p className="text-xs text-slate-400">
                                  {latestPing.status_code ? `Error ${latestPing.status_code}` : 'Timeout'}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => handlePing(monitor.id)}
                          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Ping Now
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;