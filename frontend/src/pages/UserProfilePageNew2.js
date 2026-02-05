import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, MessageCircle, Calendar, Edit, Gamepad2, Star, Trophy } from 'lucide-react';
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

  const getCategoryColor = (category) => {
    const colors = {
      'Aksiyon': 'from-red-500 to-orange-500',
      'RPG': 'from-purple-500 to-pink-500',
      'Strateji': 'from-blue-500 to-cyan-500',
      'default': 'from-purple-600 to-pink-600'
    };
    return colors[category] || colors.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950/50 dark:to-indigo-950 transition-colors duration-500">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&size=200&background=4338CA&color=fff`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950/50 dark:to-indigo-950 transition-colors duration-500">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="rounded-3xl shadow-xl mb-8 border-2 border-white/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="pt-8 pb-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 dark:border-purple-600 shadow-xl">
                    <img
                      src={avatarUrl}
                      alt={user.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&size=200&background=4338CA&color=fff`;
                      }}
                    />
                  </div>
                  {isOwnProfile && (
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                      <DialogTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            size="sm"
                            className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600"
                            data-testid="edit-profile-btn"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Profili Düzenle</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="username" className="text-foreground">Kullanıcı Adı</Label>
                            <Input
                              id="username"
                              value={editForm.username}
                              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                              required
                              className="dark:bg-gray-700/50 dark:border-gray-600"
                              data-testid="edit-username-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bio" className="text-foreground">Biyografi</Label>
                            <Textarea
                              id="bio"
                              value={editForm.bio}
                              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                              rows={3}
                              placeholder="Kendinizden bahsedin..."
                              className="dark:bg-gray-700/50 dark:border-gray-600"
                              data-testid="edit-bio-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="avatar" className="text-foreground">Profil Fotoğrafı URL</Label>
                            <Input
                              id="avatar"
                              value={editForm.avatar_url}
                              onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                              placeholder="https://example.com/avatar.jpg"
                              className="dark:bg-gray-700/50 dark:border-gray-600"
                              data-testid="edit-avatar-input"
                            />
                            <p className="text-xs text-muted-foreground">
                              Bir resim URL'si girin veya boş bırakın
                            </p>
                          </div>
                          <Button
                            type="submit"
                            className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600"
                            disabled={updating}
                            data-testid="save-profile-btn"
                          >
                            {updating ? 'Kaydediliyor...' : 'Kaydet'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </motion.div>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="font-serif font-bold text-4xl mb-2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                      {user.username}
                    </span>
                  </h1>
                  <p className="text-muted-foreground mb-4 flex items-center justify-center md:justify-start gap-2">
                    <Calendar className="w-4 h-4" />
                    Üye olma tarihi: {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: tr })}
                  </p>
                  {user.bio && (
                    <p className="text-foreground/80 dark:text-gray-300 leading-relaxed max-w-2xl mb-4">
                      {user.bio}
                    </p>
                  )}
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-700 rounded-2xl px-6 py-3 text-white shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        <div>
                          <p className="text-2xl font-bold">{reviews.length}</p>
                          <p className="text-sm opacity-90">İnceleme</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Reviews */}
        <div>
          <motion.div 
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Gamepad2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="font-serif font-bold text-3xl text-foreground">
              İncelemeler
            </h2>
          </motion.div>
          
          {reviews.length === 0 ? (
            <motion.div 
              className="text-center py-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-purple-500" />
              <p className="text-muted-foreground">Henüz inceleme yok.</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
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
                    data-testid={`profile-review-${review.id}`}
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
                            {review.rating && (
                              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-bold text-sm">{review.rating}/10</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(review.created_at), 'dd MMM yyyy', { locale: tr })}
                            </div>
                          </div>
                          
                          <h3 className="font-serif font-bold text-2xl text-foreground mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {review.title}
                          </h3>
                          
                          <p className="text-base text-purple-600 dark:text-purple-400 font-semibold mb-3 flex items-center gap-2">
                            <Gamepad2 className="w-5 h-5" />
                            {review.game_name}
                          </p>
                          
                          <p className="text-foreground/70 dark:text-gray-300 line-clamp-2 leading-relaxed mb-4">
                            {review.content}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-red-500">
                              <Heart className="w-5 h-5" />
                              <span className="font-semibold">{review.likes_count}</span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-500">
                              <MessageCircle className="w-5 h-5" />
                              <span className="font-semibold">{review.comments_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
