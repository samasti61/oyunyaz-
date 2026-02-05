import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, User, Calendar, Edit, Trash2, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!review) return null;

  const isAuthor = user && user.id === review.author_id;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Review Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-sans uppercase tracking-wider text-muted-foreground">
              {review.category}
            </span>
            {isAuthor && (
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(`/edit/${id}`)}
                  variant="outline"
                  size="sm"
                  className="rounded-full active:scale-95 transition-all"
                  data-testid="edit-review-btn"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Düzenle
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  size="sm"
                  className="rounded-full active:scale-95 transition-all"
                  data-testid="delete-review-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
                </Button>
              </div>
            )}
          </div>
          
          <h1 className="font-serif font-bold text-5xl text-foreground mb-4">
            {review.title}
          </h1>
          <h2 className="text-2xl text-primary font-medium mb-6">{review.game_name}</h2>
          
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
              <Button
                onClick={handleLike}
                variant="ghost"
                size="sm"
                className="rounded-full active:scale-95 transition-all"
                data-testid="like-btn"
              >
                <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                {review.likes_count}
              </Button>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{review.comments_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review Content with Word Selection */}
        <Card className="rounded-xl mb-8">
          <CardContent className="pt-6">
            <div className="bg-accent/5 border-l-4 border-accent p-4 rounded-lg mb-6">
              <p className="text-sm text-foreground/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>
                  <strong>İpucu:</strong> Anlamadığınız bir kelimeyi fare ile seçin, AI anlık açıklama yapacak!
                </span>
              </p>
            </div>
            <div
              className="review-content prose max-w-none"
              onMouseUp={handleWordSelect}
              data-testid="review-content"
            >
              {review.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4 text-foreground/80 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Word Explanation Popover */}
        {selectedWord && (
          <div className="fixed bottom-8 right-8 z-50">
            <Card className="rounded-xl shadow-lg max-w-sm" data-testid="word-explanation">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
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
              </CardHeader>
              <CardContent>
                {explainLoading ? (
                  <p className="text-sm text-muted-foreground">Açıklanıyor...</p>
                ) : (
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {wordExplanation}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tags */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {review.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments Section */}
        <div>
          <h3 className="font-serif font-bold text-2xl text-foreground mb-6">
            Yorumlar ({review.comments_count})
          </h3>
          
          {user && (
            <form onSubmit={handleComment} className="mb-8">
              <Textarea
                placeholder="Yorumunuzu yazın..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="rounded-lg mb-2"
                data-testid="comment-input"
              />
              <Button
                type="submit"
                className="rounded-full bg-primary hover:bg-primary/90 active:scale-95 transition-all"
                data-testid="submit-comment-btn"
              >
                Yorum Yap
              </Button>
            </form>
          )}
          
          <div className="space-y-4" data-testid="comments-list">
            {comments.length === 0 ? (
              <p className="text-muted-foreground">Henüz yorum yok. İlk yorumu siz yapın!</p>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="rounded-xl">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{comment.author_username}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                      </span>
                    </div>
                    <p className="text-foreground/80">{comment.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;