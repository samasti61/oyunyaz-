import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, User, Calendar, TrendingUp } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-paper to-white">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            Oyun Topluluğunun Favorisi
          </div>
          <h1 className="font-serif font-bold text-5xl md:text-6xl text-foreground mb-4 tracking-tight">
            En İyi Oyun İncelemelerini
            <br />
            <span className="text-primary">Keşfet</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Oyun severler için detaylı incelemeler, yaratıcı hikayeler ve yapay zeka destekli yazım deneyimi.
          </p>
        </div>

        {/* Filter */}
        <div className="mb-8 flex justify-center">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-80 rounded-full h-12" data-testid="category-filter">
              <SelectValue placeholder="Kategori seç" />
            </SelectTrigger>
            <SelectContent className="max-h-96">
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Henüz inceleme yok.</p>
            <Button 
              onClick={() => navigate('/create')}
              className="rounded-full bg-primary hover:bg-primary/90 active:scale-95 transition-all"
              data-testid="first-review-btn"
            >
              İlk İncelemeyi Siz Yazın
            </Button>
          </div>
        ) : (
          <div className="space-y-6" data-testid="reviews-list">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className="bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden cursor-pointer active:scale-[0.99]"
                onClick={() => navigate(`/review/${review.id}`)}
                data-testid={`review-card-${review.id}`}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left side - Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider rounded-full">
                          {review.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(review.created_at), 'dd MMM yyyy', { locale: tr })}
                        </div>
                      </div>
                      
                      <h2 className="font-serif font-bold text-3xl text-foreground mb-2 group-hover:text-primary transition-colors">
                        {review.title}
                      </h2>
                      
                      <p className="text-lg font-medium text-primary mb-4">{review.game_name}</p>
                      
                      <p className="text-foreground/70 line-clamp-2 leading-relaxed mb-4">
                        {review.content}
                      </p>
                      
                      {/* Tags */}
                      {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {review.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Right side - Stats */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-border/50 md:pl-6">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{review.author_username}</span>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1 text-sm">
                          <Heart className="w-5 h-5 text-red-500" />
                          <span className="font-semibold">{review.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <MessageCircle className="w-5 h-5 text-blue-500" />
                          <span className="font-semibold">{review.comments_count}</span>
                        </div>
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
