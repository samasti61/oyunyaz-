import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, User, Calendar } from 'lucide-react';
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
      console.log('Fetching reviews from:', url);
      const response = await axios.get(url);
      console.log('Reviews fetched:', response.data);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="font-serif font-bold text-5xl md:text-6xl text-foreground mb-6">
            Oyun İncelemelerini Keşfet
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Oyun severler için en detaylı incelemeler ve yaratıcı hikayeler. 
            Toplulukla paylaş, birlikte yaz.
          </p>
        </div>

        {/* Filter */}
        <div className="mb-8 flex justify-center">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-64 rounded-full" data-testid="category-filter">
              <SelectValue placeholder="Kategori seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reviews Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="reviews-grid">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className="bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden cursor-pointer active:scale-95"
                onClick={() => navigate(`/review/${review.id}`)}
                data-testid={`review-card-${review.id}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground">
                      {review.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(review.created_at), 'dd MMM yyyy', { locale: tr })}
                    </div>
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-foreground/90 mb-2 group-hover:text-primary transition-colors">
                    {review.title}
                  </h3>
                  <p className="text-sm text-primary font-medium">{review.game_name}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80 line-clamp-3 leading-relaxed">
                    {review.content}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{review.author_username}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{review.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{review.comments_count}</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;