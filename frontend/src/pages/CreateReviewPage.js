import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, Star, Image as ImageIcon, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateReviewPage = () => {
  const [title, setTitle] = useState('');
  const [gameName, setGameName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [rating, setRating] = useState(0);
  const [coverImage, setCoverImage] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchReview();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchReview = async () => {
    try {
      const response = await axios.get(`${API}/reviews/${id}`);
      const review = response.data;
      setTitle(review.title);
      setGameName(review.game_name);
      setContent(review.content);
      setCategory(review.category);
      setTags(review.tags.join(', '));
      setRating(review.rating || 0);
      setCoverImage(review.cover_image || '');
    } catch (error) {
      toast.error('İnceleme yüklenemedi!');
      navigate('/');
    }
  };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Lütfen bir istek yazın!');
      return;
    }
    
    setAiLoading(true);
    try {
      const response = await axios.post(`${API}/ai/assist`, {
        prompt: aiPrompt,
        context: content
      });
      setAiSuggestion(response.data.suggestion);
      toast.success('AI önerisi alındı!');
    } catch (error) {
      toast.error('AI asistanı şu anda kullanılamıyor!');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !gameName.trim() || !content.trim() || !category) {
      toast.error('Lütfen tüm alanları doldurun!');
      return;
    }
    
    setLoading(true);
    try {
      const reviewData = {
        title: title.trim(),
        game_name: gameName.trim(),
        content: content.trim(),
        category,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        rating: rating > 0 ? rating : null,
        cover_image: coverImage.trim() || null
      };
      
      if (isEditing) {
        await axios.put(`${API}/reviews/${id}`, reviewData);
        toast.success('İnceleme güncellendi!');
      } else {
        await axios.post(`${API}/reviews`, reviewData);
        toast.success('İnceleme yayınlandı!');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950/50 dark:to-indigo-950 transition-colors duration-500">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-2xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Gamepad2 className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="font-serif font-bold text-4xl text-foreground">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                {isEditing ? 'İncelemeyi Düzenle' : 'Yeni İnceleme Yaz'}
              </span>
            </h1>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSubmit}>
              <Card className="rounded-3xl border-2 border-white/50 dark:border-gray-700/50 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-foreground">Başlık</Label>
                    <Input
                      id="title"
                      placeholder="İncelemenizin başlığı"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="rounded-xl dark:bg-gray-700/50 dark:border-gray-600"
                      data-testid="review-title-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gameName" className="text-foreground">Oyun Adı</Label>
                    <Input
                      id="gameName"
                      placeholder="Oyunun adı"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      required
                      className="rounded-xl dark:bg-gray-700/50 dark:border-gray-600"
                      data-testid="game-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverImage" className="text-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Oyun Kapak Resmi URL (İsteğe Bağlı)
                    </Label>
                    <Input
                      id="coverImage"
                      placeholder="https://example.com/game-cover.jpg"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="rounded-xl dark:bg-gray-700/50 dark:border-gray-600"
                    />
                    {coverImage && (
                      <motion.div 
                        className="mt-2 w-32 h-32 rounded-xl overflow-hidden shadow-lg"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <img src={coverImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-foreground">Kategori</Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger className="rounded-xl dark:bg-gray-700/50 dark:border-gray-600" data-testid="category-select">
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rating" className="text-foreground flex items-center gap-2">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        Puanınız (1-10)
                      </Label>
                      <Select value={rating.toString()} onValueChange={(val) => setRating(parseInt(val))}>
                        <SelectTrigger className="rounded-xl dark:bg-gray-700/50 dark:border-gray-600">
                          <SelectValue placeholder="Puan verin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Puan verme</SelectItem>
                          {[1,2,3,4,5,6,7,8,9,10].map(r => (
                            <SelectItem key={r} value={r.toString()}>{r}/10</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-foreground">Etiketler (virgülle ayırın)</Label>
                    <Input
                      id="tags"
                      placeholder="fps, multiplayer, rekabetci"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="rounded-xl dark:bg-gray-700/50 dark:border-gray-600"
                      data-testid="tags-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-foreground">İçerik</Label>
                    <Textarea
                      id="content"
                      placeholder="İncelemenizi buraya yazın..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={15}
                      className="rounded-xl font-sans text-base leading-relaxed dark:bg-gray-700/50 dark:border-gray-600"
                      data-testid="content-textarea"
                    />
                  </div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg text-lg h-12"
                      disabled={loading}
                      data-testid="submit-review-btn"
                    >
                      {loading ? 'Yükleniyor...' : (isEditing ? 'Güncelle' : 'Yayınla')}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </form>
          </motion.div>
          
          {/* AI Assistant */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="rounded-3xl sticky top-24 border-2 border-purple-200 dark:border-purple-800 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  AI Yazım Asistanı
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aiPrompt" className="text-foreground">Ne yapmak istersiniz?</Label>
                  <Textarea
                    id="aiPrompt"
                    placeholder="Örnek: Bu bölümü daha ilgi çekici hale getir"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-600"
                    data-testid="ai-prompt-input"
                  />
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleAiAssist}
                    disabled={aiLoading}
                    className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                    data-testid="ai-assist-btn"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Düşünüyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Öneri Al
                      </>
                    )}
                  </Button>
                </motion.div>
                
                {aiSuggestion && (
                  <motion.div 
                    className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-purple-200 dark:border-purple-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    data-testid="ai-suggestion"
                  >
                    <p className="text-sm font-medium text-foreground mb-2">AI Önerisi:</p>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {aiSuggestion}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateReviewPage;
