import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold mb-4 text-gray-900 dark:text-white">
              Marketplace for Memes
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover, buy, and sell the funniest memes on the internet. Join
              thousands of creators and collectors in the ultimate meme
              marketplace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Shopping
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Sell Your Memes
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Create</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upload your original memes and start earning
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Earn</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get paid for every meme purchase
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Share</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Spread laughter across the internet
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
