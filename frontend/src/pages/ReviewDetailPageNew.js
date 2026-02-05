import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, User, Calendar, Edit, Trash2, Sparkles, Star, Gamepad2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReviewDetailPage = () => {
  const [review, setReview] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordExplanation, setWordExplanation] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);
  
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReview();
    fetchComments();
    if (user) {
      checkLiked();
    }
  }, [id, user]);

  const fetchReview = async () => {
    try {
      const response = await axios.get(`${API}/reviews/${id}`);
      setReview(response.data);
    } catch (error) {
      toast.error('İnceleme bulunamadı!');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/reviews/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const checkLiked = async () => {
    try {
      const response = await axios.get(`${API}/reviews/${id}/liked`);
      setLiked(response.data.liked);
    } catch (error) {
      console.error('Failed to check like status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Beğenmek için giriş yapın!');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/reviews/${id}/like`);
      setLiked(response.data.liked);
      setReview(prev => ({
        ...prev,
        likes_count: prev.likes_count + (response.data.liked ? 1 : -1)
      }));
    } catch (error) {
      toast.error('Bir hata oluştu!');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Yorum yapmak için giriş yapın!');
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      const response = await axios.post(`${API}/reviews/${id}/comments`, {
        content: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
      setReview(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
      toast.success('Yorum eklendi!');
    } catch (error) {
      toast.error('Yorum eklenemedi!');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('İncelemeyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API}/reviews/${id}`);
      toast.success('İnceleme silindi!');
      navigate('/');
    } catch (error) {
      toast.error('İnceleme silinemedi!');
    }
  };

  const handleWordSelect = async () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text.length > 0 && text.length < 50) {
      setSelectedWord(text);
      setExplainLoading(true);
      setWordExplanation('');
      
      try {
        const response = await axios.post(`${API}/ai/explain`, {
          word: text,
          context: review.content
        });
        setWordExplanation(response.data.explanation);
      } catch (error) {
        setWordExplanation('Kelime açıklaması alınamadı.');
      } finally {
        setExplainLoading(false);
      }
    }
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

  if (!review) return null;

  const isAuthor = user && user.id === review.author_id;
  const getCategoryColor = (category) => {
    const colors = {
      'Aksiyon': 'from-red-500 to-orange-500',
      'RPG': 'from-purple-500 to-pink-500',
      'default': 'from-purple-600 to-pink-600'
    };
    return colors[category] || colors.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950/50 dark:to-indigo-950 transition-colors duration-500">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-4 py-2 bg-gradient-to-r ${getCategoryColor(review.category)} text-white text-sm font-bold uppercase tracking-wider rounded-full shadow-lg`}>
                {review.category}
              </span>
              {isAuthor && (
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => navigate(`/edit/${id}`)}
                      variant="outline"
                      size="sm"
                      className="rounded-full dark:bg-gray-800 dark:border-gray-600"
                      data-testid="edit-review-btn"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      size="sm"
                      className="rounded-full"
                      data-testid="delete-review-btn"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Sil
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
            
            <h1 className="font-serif font-bold text-5xl mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                {review.title}
              </span>
            </h1>
            
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-2">
                <Gamepad2 className="w-6 h-6" />
                {review.game_name}
              </h2>
              {review.rating && (
                <div className="flex items-center gap-1 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full shadow-md">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-bold text-lg">{review.rating}/10</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b border-border/50 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span
                    className="hover:text-primary cursor-pointer transition-colors"
                    onClick={() => navigate(`/profile/${review.author_id}`)}
                    data-testid="author-link"
                  >
                    {review.author_username}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: tr })}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    onClick={handleLike}
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    data-testid="like-btn"
                  >
                    <Heart className={`w-5 h-5 mr-1 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                    {review.likes_count}
                  </Button>
                </motion.div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{review.comments_count}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          {review.cover_image && (
            <motion.div 
              className="mb-8 rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <img
                src={review.cover_image}
                alt={review.game_name}
                className="w-full max-h-96 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </motion.div>
          )}

          {/* Content */}
          <Card className="rounded-3xl mb-8 border-2 border-white/50 dark:border-gray-700/50 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-lg mb-6">
                <p className="text-sm text-foreground/80 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>
                    <strong>İpucu:</strong> Anlamadığınız bir kelimeyi fare ile seçin, AI anlık açıklama yapacak!
                  </span>
                </p>
              </div>
              <div
                className="prose max-w-none dark:prose-invert"
                onMouseUp={handleWordSelect}
                data-testid="review-content"
              >
                {review.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 text-foreground/90 dark:text-gray-200 leading-relaxed text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Word Explanation Popup */}
          {selectedWord && (
            <motion.div 
              className="fixed bottom-8 right-8 z-50 max-w-sm"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
            >
              <Card className="rounded-2xl shadow-2xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800" data-testid="word-explanation">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif font-bold text-lg flex items-center gap-2 text-foreground">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      {selectedWord}
                    </h3>
                    <Button
                      onClick={() => setSelectedWord(null)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      data-testid="close-explanation-btn"
                    >
                      ×
                    </Button>
                  </div>
                  {explainLoading ? (
                    <p className="text-sm text-muted-foreground">Açıklanıyor...</p>
                  ) : (
                    <p className="text-sm text-foreground/80 dark:text-gray-300 leading-relaxed">
                      {wordExplanation}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tags */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {review.tags.map((tag, idx) => (
                <motion.span
                  key={idx}
                  className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full border border-purple-200 dark:border-purple-700/50"
                  whileHover={{ scale: 1.05 }}
                >
                  #{tag}
                </motion.span>
              ))}
            </div>
          )}

          {/* Comments Section */}
          <div>
            <h3 className="font-serif font-bold text-3xl text-foreground mb-6 flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              Yorumlar ({review.comments_count})
            </h3>
            
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <form onSubmit={handleComment} className="mb-8">
                  <Textarea
                    placeholder="Yorumunuzu yazın..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="rounded-xl mb-2 dark:bg-gray-700/50 dark:border-gray-600"
                    data-testid="comment-input"
                  />
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600"
                      data-testid="submit-comment-btn"
                    >
                      Yorum Yap
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            )}
            
            <div className="space-y-4" data-testid="comments-list">
              {comments.length === 0 ? (
                <Card className="rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Henüz yorum yok. İlk yorumu siz yapın!</p>
                  </CardContent>
                </Card>
              ) : (
                comments.map((comment, idx) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/50 dark:border-gray-700/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-foreground">{comment.author_username}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                          </span>
                        </div>
                        <p className="text-foreground/80 dark:text-gray-300">{comment.content}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;
