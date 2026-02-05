import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Heart, MessageCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserProfilePage = () => {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchUserReviews();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      toast.error('Kullanıcı bulunamadı!');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const response = await axios.get(`${API}/users/${userId}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch user reviews:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="mb-12 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-serif font-bold text-primary">
              {user.username[0].toUpperCase()}
            </span>
          </div>
          <h1 className="font-serif font-bold text-4xl text-foreground mb-2">
            {user.username}
          </h1>
          <p className="text-muted-foreground">
            Üye olma tarihi: {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: tr })}
          </p>
          {user.bio && (
            <p className="mt-4 text-foreground/80 max-w-2xl mx-auto">{user.bio}</p>
          )}
        </div>

        {/* User Reviews */}
        <div>
          <h2 className="font-serif font-bold text-3xl text-foreground mb-8">
            İncelemeler ({reviews.length})
          </h2>
          
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Henüz inceleme yok.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <Card
                  key={review.id}
                  className="bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden cursor-pointer active:scale-95"
                  onClick={() => navigate(`/review/${review.id}`)}
                  data-testid={`profile-review-${review.id}`}
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
    </div>
  );
};

export default UserProfilePage;