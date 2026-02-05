import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, User, Calendar, Gamepad2, Trophy, Star, Zap, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [reviews, setReviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchReviews();
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
      const url = selectedCategory === 'all' 
        ? `${API}/reviews`
        : `${API}/reviews?category=${selectedCategory}`;
      const response = await axios.get(url);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Aksiyon': 'bg-red-500',
      'RPG': 'bg-purple-500',
      'Strateji': 'bg-blue-500',
      'Macera': 'bg-green-500',
      'Korku': 'bg-gray-800',
      'FPS': 'bg-orange-500',
      'MOBA': 'bg-indigo-500',
      'default': 'bg-primary'
    };
    return colors[category] || colors.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background Gaming Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-9xl">🎮</div>
        <div className="absolute top-40 right-20 text-7xl">🕹️</div>
        <div className="absolute bottom-20 left-1/4 text-8xl">🎯</div>
        <div className="absolute top-1/3 right-1/3 text-6xl">⭐</div>
        <div className="absolute bottom-40 right-10 text-9xl">🏆</div>
      </div>

      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Minimal Header - Left Top */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-2xl shadow-lg">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-3xl text-foreground flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Oyun İncelemeleri
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">En iyi içerikleri keşfet</p>
            </div>
          </div>

          {/* Filter with fun icons */}
          <div className="flex items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64 rounded-full h-11 border-2 border-purple-200 hover:border-purple-400 transition-all shadow-md bg-white" data-testid="category-filter">
                <SelectValue placeholder="🎮 Kategori seç" />
              </SelectTrigger>
              <SelectContent className="max-h-96">
                <SelectItem value="all">🌟 Tüm Kategoriler</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => navigate('/create')}
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 mr-2" />
              Yeni İnceleme
            </Button>
          </div>
        </div>

        {/* Fun Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{reviews.length}</p>
                <p className="text-sm opacity-90">İnceleme</p>
              </div>
              <Trophy className="w-10 h-10 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">AI</p>
                <p className="text-sm opacity-90">Destekli</p>
              </div>
              <Star className="w-10 h-10 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">CANLI</p>
                <p className="text-sm opacity-90">Topluluk</p>
              </div>
              <Flame className="w-10 h-10 opacity-50" />
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="text-muted-foreground mt-4">Yükleniyor...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <p className="text-lg text-muted-foreground mb-4">Henüz inceleme yok.</p>
            <Button 
              onClick={() => navigate('/create')}
              className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
              data-testid="first-review-btn"
            >
              <Zap className="w-4 h-4 mr-2" />
              İlk İncelemeyi Siz Yazın
            </Button>
          </div>
        ) : (
          <div className="space-y-5" data-testid="reviews-list">
            {reviews.map((review, idx) => (
              <Card
                key={review.id}
                className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-white shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
                onClick={() => navigate(`/review/${review.id}`)}
                data-testid={`review-card-${review.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Left side - Main content (wider) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-4 py-1.5 ${getCategoryColor(review.category)} text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md`}>
                          {review.category}
                        </span>
                        {idx === 0 && (
                          <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-md animate-pulse">
                            🔥 POPÜLER
                          </span>
                        )}
                      </div>
                      
                      <h2 className="font-serif font-bold text-2xl text-foreground mb-2 group-hover:text-purple-600 transition-colors">
                        {review.title}
                      </h2>
                      
                      <p className="text-lg font-semibold text-purple-600 mb-3 flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5" />
                        {review.game_name}
                      </p>
                      
                      <p className="text-foreground/70 line-clamp-2 leading-relaxed mb-4">
                        {review.content}
                      </p>
                      
                      {/* Tags */}
                      {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {review.tags.slice(0, 4).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-medium rounded-full border border-purple-200"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Right side - User bubble */}
                    <div className="flex flex-col items-end gap-3">
                      {/* User bubble */}
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg min-w-[140px]">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-4 h-4" />
                          <span className="font-semibold text-sm truncate">{review.author_username}</span>
                        </div>
                        
                        {/* Stats bubbles */}
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
                      
                      {/* Date */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 px-3 py-1.5 rounded-full">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(review.created_at), 'dd MMM', { locale: tr })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
