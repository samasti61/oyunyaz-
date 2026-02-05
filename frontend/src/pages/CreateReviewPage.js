import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateReviewPage = () => {
  const [title, setTitle] = useState('');
  const [gameName, setGameName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
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
        tags: tags.split(',').map(t => t.trim()).filter(t => t)
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
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif font-bold text-4xl text-foreground mb-8">
          {isEditing ? 'İncelemeyi Düzenle' : 'Yeni İnceleme Yaz'}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="rounded-xl">
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Başlık</Label>
                    <Input
                      id="title"
                      placeholder="İncelemenizin başlığı"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="rounded-lg"
                      data-testid="review-title-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gameName">Oyun Adı</Label>
                    <Input
                      id="gameName"
                      placeholder="Oyunun adı"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      required
                      className="rounded-lg"
                      data-testid="game-name-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger className="rounded-lg" data-testid="category-select">
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
                    <Label htmlFor="tags">Etiketler (virgülle ayırın)</Label>
                    <Input
                      id="tags"
                      placeholder="fps, multiplayer, rekabetci"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="rounded-lg"
                      data-testid="tags-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content">İçerik</Label>
                    <Textarea
                      id="content"
                      placeholder="İncelemenizi buraya yazın..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={15}
                      className="rounded-lg font-sans text-base leading-relaxed"
                      data-testid="content-textarea"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full rounded-full bg-primary hover:bg-primary/90 active:scale-95 transition-all"
                    disabled={loading}
                    data-testid="submit-review-btn"
                  >
                    {loading ? 'Yükleniyor...' : (isEditing ? 'Güncelle' : 'Yayınla')}
                  </Button>
                </CardContent>
              </Card>
            </form>
          </div>
          
          {/* AI Assistant */}
          <div className="lg:col-span-1">
            <Card className="rounded-xl sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-5 h-5 text-accent" />
                  AI Yazım Asistanı
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aiPrompt">Ne yapmak istersiniz?</Label>
                  <Textarea
                    id="aiPrompt"
                    placeholder="Örnek: Bu bölümü daha ilgi çekici hale getir"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    className="rounded-lg"
                    data-testid="ai-prompt-input"
                  />
                </div>
                <Button
                  onClick={handleAiAssist}
                  disabled={aiLoading}
                  className="w-full rounded-full bg-accent hover:bg-accent/90 active:scale-95 transition-all"
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
                
                {aiSuggestion && (
                  <div className="p-4 bg-muted rounded-lg ai-suggestion-box" data-testid="ai-suggestion">
                    <p className="text-sm font-medium text-foreground/90 mb-2">AI Önerisi:</p>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {aiSuggestion}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReviewPage;