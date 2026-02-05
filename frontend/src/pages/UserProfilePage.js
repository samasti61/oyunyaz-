import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, MessageCircle, Calendar, Edit, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserProfilePage = () => {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '', avatar_url: '' });
  const [updating, setUpdating] = useState(false);
  
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = currentUser && currentUser.id === userId;

  useEffect(() => {
    fetchUser();
    fetchUserReviews();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/users/${userId}`);
      setUser(response.data);
      setEditForm({
        username: response.data.username,
        bio: response.data.bio || '',
        avatar_url: response.data.avatar_url || ''
      });
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const response = await axios.put(`${API}/users/me`, editForm);
      setUser(response.data);
      toast.success('Profil güncellendi!');
      setEditDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Profil güncellenemedi!');
    } finally {
      setUpdating(false);
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

  const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&size=200&background=4338CA&color=fff`;

  return (
    <div className=\"min-h-screen bg-gradient-to-b from-paper to-white\">
      <Navbar />
      
      <div className=\"max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12\">
        {/* Profile Header */}
        <Card className=\"rounded-2xl shadow-lg mb-8\">
          <CardContent className=\"pt-8 pb-6\">
            <div className=\"flex flex-col md:flex-row items-center md:items-start gap-6\">
              <div className=\"relative\">
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className=\"w-32 h-32 rounded-full object-cover border-4 border-primary/20\"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&size=200&background=4338CA&color=fff`;
                  }}
                />
                {isOwnProfile && (
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size=\"sm\"
                        className=\"absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 shadow-lg\"
                        data-testid=\"edit-profile-btn\"
                      >
                        <Edit className=\"w-4 h-4\" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className=\"sm:max-w-md\">
                      <DialogHeader>
                        <DialogTitle>Profili Düzenle</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateProfile} className=\"space-y-4\">
                        <div className=\"space-y-2\">
                          <Label htmlFor=\"username\">Kullanıcı Adı</Label>
                          <Input
                            id=\"username\"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            required
                            data-testid=\"edit-username-input\"
                          />
                        </div>
                        <div className=\"space-y-2\">
                          <Label htmlFor=\"bio\">Biyografi</Label>
                          <Textarea
                            id=\"bio\"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            rows={3}
                            placeholder=\"Kendinizden bahsedin...\"
                            data-testid=\"edit-bio-input\"
                          />
                        </div>
                        <div className=\"space-y-2\">
                          <Label htmlFor=\"avatar\">Profil Fotoğrafı URL</Label>
                          <Input
                            id=\"avatar\"
                            value={editForm.avatar_url}
                            onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                            placeholder=\"https://example.com/avatar.jpg\"
                            data-testid=\"edit-avatar-input\"
                          />
                          <p className=\"text-xs text-muted-foreground\">
                            Bir resim URL'si girin veya boş bırakın
                          </p>
                        </div>
                        <Button
                          type=\"submit\"
                          className=\"w-full rounded-full\"
                          disabled={updating}
                          data-testid=\"save-profile-btn\"
                        >
                          {updating ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              <div className=\"flex-1 text-center md:text-left\">
                <h1 className=\"font-serif font-bold text-4xl text-foreground mb-2\">
                  {user.username}
                </h1>
                <p className=\"text-muted-foreground mb-4\">
                  Üye olma tarihi: {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: tr })}
                </p>
                {user.bio && (
                  <p className=\"text-foreground/80 leading-relaxed max-w-2xl\">
                    {user.bio}
                  </p>
                )}
                <div className=\"mt-4 flex items-center justify-center md:justify-start gap-4 text-sm\">
                  <div className=\"flex items-center gap-1\">
                    <span className=\"font-bold text-2xl text-foreground\">{reviews.length}</span>
                    <span className=\"text-muted-foreground\">İnceleme</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Reviews */}
        <div>
          <h2 className=\"font-serif font-bold text-3xl text-foreground mb-6\">
            İncelemeler
          </h2>
          
          {reviews.length === 0 ? (
            <p className=\"text-center text-muted-foreground py-12\">
              Henüz inceleme yok.
            </p>
          ) : (
            <div className=\"space-y-6\">
              {reviews.map((review) => (
                <Card
                  key={review.id}
                  className=\"bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden cursor-pointer active:scale-[0.99]\"
                  onClick={() => navigate(`/review/${review.id}`)}
                  data-testid={`profile-review-${review.id}`}
                >
                  <CardContent className=\"p-6\">
                    <div className=\"flex flex-col md:flex-row gap-4\">
                      <div className=\"flex-1 min-w-0\">
                        <div className=\"flex items-center gap-3 mb-3\">
                          <span className=\"px-3 py-1 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider rounded-full\">
                            {review.category}
                          </span>
                          <div className=\"flex items-center gap-1 text-xs text-muted-foreground\">
                            <Calendar className=\"w-3 h-3\" />
                            {format(new Date(review.created_at), 'dd MMM yyyy', { locale: tr })}
                          </div>
                        </div>
                        <h3 className=\"font-serif font-bold text-2xl text-foreground/90 mb-2 group-hover:text-primary transition-colors\">
                          {review.title}
                        </h3>
                        <p className=\"text-base text-primary font-medium mb-3\">{review.game_name}</p>
                        <p className=\"text-foreground/70 line-clamp-2 leading-relaxed\">
                          {review.content}
                        </p>
                      </div>
                      <div className=\"flex md:flex-col items-center md:items-end justify-start gap-4\">
                        <div className=\"flex items-center gap-1 text-sm\">
                          <Heart className=\"w-5 h-5 text-red-500\" />
                          <span className=\"font-semibold\">{review.likes_count}</span>
                        </div>
                        <div className=\"flex items-center gap-1 text-sm\">
                          <MessageCircle className=\"w-5 h-5 text-blue-500\" />
                          <span className=\"font-semibold\">{review.comments_count}</span>
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
    </div>
  );
};

export default UserProfilePage;
