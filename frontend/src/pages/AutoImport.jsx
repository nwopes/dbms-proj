import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AutoImport() {
  const [inputType, setInputType] = useState('url'); // 'url' or 'text'
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error('Please provide input data.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = inputType === 'url' ? { url: inputValue } : { text: inputValue };
      
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract data');
      }

      setResult(data.data.extracted_details);
      toast.success('Successfully extracted and imported data!');
      setInputValue('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 animated-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">AI Data Extraction</h1>
            <p className="text-slate-400">Automatically parse news articles or text into structured crime database records</p>
          </div>
        </div>

        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6 md:p-8 backdrop-blur-sm shadow-xl">
          <form onSubmit={handleImport} className="space-y-6">
            
            <div className="flex gap-4 p-1 bg-navy-900 rounded-lg w-fit border border-navy-700">
              <button
                type="button"
                onClick={() => setInputType('url')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  inputType === 'url' ? 'bg-accent-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                Article URL
              </button>
              <button
                type="button"
                onClick={() => setInputType('text')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  inputType === 'text' ? 'bg-accent-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw Text
              </button>
            </div>

            <div>
              {inputType === 'url' ? (
                <input
                  type="url"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="https://example.com/news/crime-article"
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all font-mono"
                  required
                />
              ) : (
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Paste unstructured crime report or article text here..."
                  className="w-full h-48 bg-navy-900 border border-navy-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all resize-y"
                  required
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-500 hover:bg-accent-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing with GPT API...
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span> Extract & Import Data
                </>
              )}
            </button>
          </form>
        </div>

        {result && (
          <div className="mt-8 bg-navy-800/80 rounded-xl border border-green-500/30 p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)] animated-fade-in overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">✓</span> Import Successful
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-navy-900 rounded-lg p-4 border border-navy-700">
                  <h4 className="text-accent-400 font-semibold mb-2 text-sm uppercase tracking-wider">Crime Details</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    <li><span className="text-slate-500">Type:</span> {result.crime?.crime_type}</li>
                    <li><span className="text-slate-500">Date:</span> {result.crime?.date}</li>
                    <li><span className="text-slate-500">Status:</span> <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-xs">{result.crime?.status}</span></li>
                  </ul>
                  <p className="mt-3 text-sm text-slate-400 italic line-clamp-2">"{result.crime?.description}"</p>
                </div>
                
                <div className="bg-navy-900 rounded-lg p-4 border border-navy-700">
                  <h4 className="text-accent-400 font-semibold mb-2 text-sm uppercase tracking-wider">Location</h4>
                  <p className="text-sm text-slate-300">
                    {result.location?.address}, {result.location?.city}, {result.location?.state} {result.location?.pincode}
                  </p>
                </div>
              </div>

              <div className="bg-navy-900 rounded-lg p-4 border border-navy-700 h-full">
                <h4 className="text-accent-400 font-semibold mb-3 text-sm uppercase tracking-wider">Persons Associated ({result.persons?.length || 0})</h4>
                <div className="space-y-3">
                  {result.persons?.map((person, idx) => (
                     <div key={idx} className="flex items-center justify-between p-2 rounded bg-navy-800 border border-navy-600">
                        <div>
                          <p className="text-sm font-medium text-white">{person.name}</p>
                          <p className="text-xs text-slate-400">{person.age ? person.age + ' yrs' : ''} • {person.gender}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-accent-500/20 text-accent-400">
                          {person.role}
                        </span>
                     </div>
                  ))}
                  {(!result.persons || result.persons.length === 0) && (
                    <p className="text-sm text-slate-500">No persons identified.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
