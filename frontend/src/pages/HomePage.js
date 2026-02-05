import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, User, Calendar, Gamepad2, Trophy, Star, Zap, Flame, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [reviews, setReviews] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const reviewsPerPage = 10;
  const navigate = useNavigate();

  const totalPages = Math.ceil(totalReviews / reviewsPerPage);

  useEffect(() => {
    fetchCategories();
    fetchReviews();
    fetchPopularGames();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * reviewsPerPage;
      const url = selectedCategory === 'all' 
        ? `${API}/reviews?skip=${skip}&limit=${reviewsPerPage}`
        : `${API}/reviews?category=${selectedCategory}&skip=${skip}&limit=${reviewsPerPage}`;
      const response = await axios.get(url);
      setReviews(response.data);
      
      // Get total count
      const countUrl = selectedCategory === 'all'
        ? `${API}/reviews`
        : `${API}/reviews?category=${selectedCategory}`;
      const countResponse = await axios.get(countUrl);
      setTotalReviews(countResponse.data.length);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularGames = async () => {
    try {
      const response = await axios.get(`${API}/popular-games?limit=3`);
      setPopularGames(response.data.popular_games);
    } catch (error) {
      console.error('Failed to fetch popular games:', error);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Aksiyon': 'from-red-500 to-orange-500',
      'RPG': 'from-purple-500 to-pink-500',
      'Strateji': 'from-blue-500 to-cyan-500',
      'Macera': 'from-green-500 to-emerald-500',
      'Korku': 'from-gray-700 to-gray-900',
      'FPS': 'from-orange-500 to-red-600',
      'MOBA': 'from-indigo-500 to-purple-600',
      'default': 'from-purple-600 to-pink-600'
    };
    return colors[category] || colors.default;
  };

  const getRatingColor = (rating) => {
    if (rating >= 9) return 'text-green-500';
    if (rating >= 7) return 'text-blue-500';
    if (rating >= 5) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950/50 dark:to-indigo-950 relative overflow-hidden transition-colors duration-500">
      {/* Background Gaming Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-[0.03]">
        <motion.div 
          className="absolute top-10 left-10 text-9xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          🎮
        </motion.div>
        <motion.div 
          className="absolute top-40 right-20 text-7xl"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🕹️
        </motion.div>
        <motion.div 
          className="absolute bottom-20 left-1/4 text-8xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          🎯
        </motion.div>
        <motion.div className="absolute top-1/3 right-1/3 text-6xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 15, repeat: Infinity }}
        >
          ⭐
        </motion.div>
        <motion.div className="absolute bottom-40 right-10 text-9xl"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          🏆
        </motion.div>
      </div>

      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="flex items-start justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-2xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Gamepad2 className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="font-serif font-bold text-3xl text-foreground flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Oyun İncelemeleri
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">En iyi içerikleri keşfet</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64 rounded-full h-11 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all shadow-md bg-white dark:bg-gray-800/90" data-testid="category-filter">
                <SelectValue placeholder="🎮 Kategori seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌟 Tüm Kategoriler</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/create')}
                className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all"
              >
                <Zap className="w-4 h-4 mr-2" />
                Yeni İnceleme
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Popular Games Bubbles */}
        {popularGames.length > 0 && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h2 className="font-serif font-bold text-xl text-foreground">En Popüler Oyunlar</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {popularGames.map((game, idx) => (
                <motion.div
                  key={game.game_name}
                  className="min-w-[280px] bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 dark:from-yellow-600 dark:via-orange-600 dark:to-red-700 rounded-2xl p-4 text-white shadow-lg cursor-pointer overflow-hidden"
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => {
                    setSelectedCategory('all');
                    setTimeout(() => {
                      const gameReviews = reviews.filter(r => r.game_name === game.game_name);
                      if (gameReviews.length > 0) {
                        navigate(`/review/${gameReviews[0].id}`);
                      }
                    }, 100);
                  }}
                >
                  {game.cover_image && (
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-3">
                      <img 
                        src={game.cover_image} 
                        alt={game.game_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg truncate">{game.game_name}</h3>
                      <p className="text-sm opacity-90">{game.review_count} İnceleme</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{game.total_likes}</span>
                    </div>
                    {game.avg_rating && (
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold">{game.avg_rating}/10</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Fun Stats Bar */}
        <motion.div 
          className="grid grid-cols-2 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { label: 'İnceleme', value: reviews.length, icon: Trophy, gradient: 'from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-700' },
            { label: 'Topluluk', value: 'CANLI', icon: Flame, gradient: 'from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-700' }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 text-white shadow-lg`}
              whileHover={{ scale: 1.05, y: -5 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm opacity-90">{stat.label}</p>
                </div>
                <stat.icon className="w-10 h-10 opacity-50" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Reviews List - Devam edecek... */}
        {loading ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="text-muted-foreground mt-4">Yükleniyor...</p>
          </motion.div>
        ) : reviews.length === 0 ? (
          <motion.div 
            className="text-center py-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <p className="text-lg text-muted-foreground mb-4">Henüz inceleme yok.</p>
            <Button 
              onClick={() => navigate('/create')}
              className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              İlk İncelemeyi Siz Yazın
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border-2 border-white/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
                  onClick={() => navigate(`/review/${review.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {review.cover_image && (
                        <motion.div 
                          className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg"
                          whileHover={{ scale: 1.05 }}
                        >
                          <img
                            src={review.cover_image}
                            alt={review.game_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </motion.div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-4 py-1.5 bg-gradient-to-r ${getCategoryColor(review.category)} text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md`}>
                            {review.category}
                          </span>
                          {idx === 0 && (
                            <motion.span 
                              className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-md"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              🔥 POPÜLER
                            </motion.span>
                          )}
                          {review.rating && (
                            <div className={`flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-full ${getRatingColor(review.rating)}`}>
                              <Star className="w-4 h-4 fill-current" />
                              <span className="font-bold text-sm">{review.rating}/10</span>
                            </div>
                          )}
                        </div>
                        
                        <h2 className="font-serif font-bold text-2xl text-foreground mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {review.title}
                        </h2>
                        
                        <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                          <Gamepad2 className="w-5 h-5" />
                          {review.game_name}
                        </p>
                        
                        <p className="text-foreground/70 dark:text-gray-300 line-clamp-2 leading-relaxed mb-4">
                          {review.content}
                        </p>
                        
                        {review.tags && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {review.tags.slice(0, 4).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full border border-purple-200 dark:border-purple-700/50"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <motion.div 
                        className="flex flex-col items-end gap-3"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-700 rounded-2xl p-4 text-white shadow-lg min-w-[140px]">
                          <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4" />
                            <span className="font-semibold text-sm truncate">{review.author_username}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              <span className="font-bold text-sm">{review.likes_count}</span>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span className="font-bold text-sm">{review.comments_count}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-full">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(review.created_at), 'dd MMM', { locale: tr })}
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && reviews.length > 0 && totalPages > 1 && (
          <motion.div 
            className="mt-12 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                currentPage === 1
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-foreground hover:bg-purple-100 dark:hover:bg-purple-900/30 shadow-md hover:shadow-lg'
              }`}
              whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
              whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
            >
              ← Önceki
            </motion.button>

            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                // Show first page, last page, current page, and pages around current
                const showPage = 
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                
                const showEllipsis = 
                  (pageNum === currentPage - 2 && currentPage > 3) ||
                  (pageNum === currentPage + 2 && currentPage < totalPages - 2);

                if (showEllipsis) {
                  return (
                    <span key={pageNum} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }

                if (!showPage) return null;

                return (
                  <motion.button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-full font-semibold transition-all ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white dark:bg-gray-800 text-foreground hover:bg-purple-100 dark:hover:bg-purple-900/30 shadow-md'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-foreground hover:bg-purple-100 dark:hover:bg-purple-900/30 shadow-md hover:shadow-lg'
              }`}
              whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
              whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
            >
              Sonraki →
            </motion.button>

            <div className="ml-4 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
              <span className="text-sm text-foreground font-medium">
                Sayfa <span className="font-bold text-purple-600 dark:text-purple-400">{currentPage}</span> / {totalPages}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
