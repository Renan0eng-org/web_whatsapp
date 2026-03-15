"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    generateDocId,
    rsvpDb,
    type SavedDocument,
} from "@/lib/rsvp-database";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    ChevronDown,
    ChevronUp,
    FileText,
    FolderOpen,
    Maximize2,
    Minimize2,
    Pause,
    Play,
    RotateCcw,
    Save,
    Settings,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import pdfToText from "react-pdftotext";

// Tipos
interface RSVPSettings {
  wpm: number;
  fontSize: number;
  wordsPerDisplay: 1 | 2;
  showORP: boolean;
  smartPunctuation: boolean;
}

interface RSVPState {
  words: string[];
  currentIndex: number;
  isPlaying: boolean;
  isFullscreen: boolean;
  text: string;
  fileName: string;
  documentId: string | null;
}

// Constantes
const DEFAULT_SETTINGS: RSVPSettings = {
  wpm: 300,
  fontSize: 48,
  wordsPerDisplay: 1,
  showORP: true,
  smartPunctuation: true,
};

const STORAGE_KEY = "rsvp-settings";
const PUNCTUATION_DELAY_MULTIPLIER = 1.5;

// Função para calcular ORP (Optimal Recognition Point)
const calculateORP = (word: string): number => {
  const length = word.length;
  if (length <= 1) return 0;
  if (length <= 5) return Math.floor(length / 2) - 1;
  if (length <= 9) return Math.floor(length / 2);
  if (length <= 13) return Math.floor(length / 2) + 1;
  return Math.floor(length / 2) + 2;
};

// Função para renderizar palavra com ORP
const renderWordWithORP = (word: string, showORP: boolean): React.ReactNode => {
  if (!showORP || !word) return word;

  const orpIndex = calculateORP(word);
  const before = word.slice(0, orpIndex);
  const highlight = word[orpIndex] || "";
  const after = word.slice(orpIndex + 1);

  return (
    <span className="inline-flex items-baseline justify-center">
      <span className="text-foreground">{before}</span>
      <span className="text-red-500 font-bold">{highlight}</span>
      <span className="text-foreground">{after}</span>
    </span>
  );
};

// Função para verificar se a palavra termina com pontuação
const endsWithPunctuation = (word: string): boolean => {
  return /[.,;:!?]$/.test(word);
};

// Formatar data
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function RSVPReader() {
  // Estados
  const [settings, setSettings] = useState<RSVPSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<RSVPState>({
    words: [],
    currentIndex: 0,
    isPlaying: false,
    isFullscreen: false,
    text: "",
    fileName: "",
    documentId: null,
  });
  const [controlsOpen, setControlsOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const savePositionRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar documentos salvos
  const loadSavedDocuments = useCallback(async () => {
    try {
      const docs = await rsvpDb.getAllDocuments();
      setSavedDocuments(docs);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    }
  }, []);

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Erro ao carregar configurações:", e);
      }
    }
    loadSavedDocuments();
  }, [loadSavedDocuments]);

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Salvar posição automaticamente com debounce
  useEffect(() => {
    if (state.documentId && state.currentIndex > 0) {
      if (savePositionRef.current) {
        clearTimeout(savePositionRef.current);
      }
      savePositionRef.current = setTimeout(() => {
        rsvpDb.updateLastPosition(state.documentId!, state.currentIndex);
      }, 1000);
    }
    return () => {
      if (savePositionRef.current) {
        clearTimeout(savePositionRef.current);
      }
    };
  }, [state.currentIndex, state.documentId]);

  // Calcular intervalo baseado no WPM
  const calculateInterval = useCallback(
    (word: string): number => {
      const baseInterval = 60000 / settings.wpm;
      if (settings.smartPunctuation && endsWithPunctuation(word)) {
        return baseInterval * PUNCTUATION_DELAY_MULTIPLIER;
      }
      return baseInterval;
    },
    [settings.wpm, settings.smartPunctuation]
  );

  // Função para avançar palavra
  const advanceWord = useCallback(() => {
    setState((prev) => {
      const step = prev.words.length > 0 ? settings.wordsPerDisplay : 1;
      const nextIndex = prev.currentIndex + step;

      if (nextIndex >= prev.words.length) {
        return { ...prev, isPlaying: false, currentIndex: prev.words.length };
      }

      return { ...prev, currentIndex: nextIndex };
    });
  }, [settings.wordsPerDisplay]);

  // Controle de play/pause
  useEffect(() => {
    if (state.isPlaying && state.words.length > 0) {
      const currentWord = state.words[state.currentIndex] || "";
      const interval = calculateInterval(currentWord);

      timerRef.current = setTimeout(() => {
        advanceWord();
      }, interval);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [
    state.isPlaying,
    state.currentIndex,
    calculateInterval,
    advanceWord,
    state.words,
  ]);

  // Processar texto em palavras
  const processText = (text: string): string[] => {
    return text
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter((word) => word.length > 0);
  };

  // Carregar arquivo de texto
  const handleFileUpload = async (file: File, saveToDb: boolean = true) => {
    const extension = file.name.split(".").pop()?.toLowerCase() as
      | "txt"
      | "pdf";

    try {
      let text = "";

      if (extension === "txt") {
        text = await file.text();
      } else if (extension === "pdf") {
        text = await pdfToText(file);
      } else {
        alert("Formato não suportado. Use arquivos .txt ou .pdf");
        return;
      }

      const words = processText(text);
      let documentId: string | null = null;

      // Salvar no IndexedDB se solicitado
      if (saveToDb) {
        documentId = generateDocId();
        const doc: SavedDocument = {
          id: documentId,
          name: file.name,
          text,
          wordCount: words.length,
          createdAt: Date.now(),
          lastReadAt: Date.now(),
          lastPosition: 0,
          fileType: extension,
        };
        await rsvpDb.saveDocument(doc);
        await loadSavedDocuments();
      }

      setState((prev) => ({
        ...prev,
        text,
        words,
        currentIndex: 0,
        isPlaying: false,
        fileName: file.name,
        documentId,
      }));
      setShowLibrary(false);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      alert("Erro ao processar o arquivo. Tente novamente.");
    }
  };

  // Carregar documento salvo
  const loadSavedDocument = async (doc: SavedDocument) => {
    const words = processText(doc.text);
    setState((prev) => ({
      ...prev,
      text: doc.text,
      words,
      currentIndex: doc.lastPosition,
      isPlaying: false,
      fileName: doc.name,
      documentId: doc.id,
    }));
    await rsvpDb.updateLastPosition(doc.id, doc.lastPosition);
    setShowLibrary(false);
  };

  // Deletar documento
  const deleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      await rsvpDb.deleteDocument(id);
      await loadSavedDocuments();
      if (state.documentId === id) {
        handleClear();
      }
    }
  };

  // Salvar documento atual
  const saveCurrentDocument = async () => {
    if (!state.text || !state.fileName) return;

    setIsSaving(true);
    try {
      const extension = state.fileName.split(".").pop()?.toLowerCase() as
        | "txt"
        | "pdf";
      const documentId = state.documentId || generateDocId();
      const doc: SavedDocument = {
        id: documentId,
        name: state.fileName,
        text: state.text,
        wordCount: state.words.length,
        createdAt: Date.now(),
        lastReadAt: Date.now(),
        lastPosition: state.currentIndex,
        fileType: extension || "txt",
      };
      await rsvpDb.saveDocument(doc);
      setState((prev) => ({ ...prev, documentId }));
      await loadSavedDocuments();
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
    setIsSaving(false);
  };

  // Manipulador de input de arquivo
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, true);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file, true);
    }
  };

  // Toggle Play/Pause
  const togglePlay = useCallback(() => {
    if (state.words.length === 0) return;

    if (state.currentIndex >= state.words.length) {
      setState((prev) => ({ ...prev, currentIndex: 0, isPlaying: true }));
    } else {
      setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }, [state.words.length, state.currentIndex]);

  // Reset
  const handleReset = useCallback(() => {
    setState((prev) => ({ ...prev, currentIndex: 0, isPlaying: false }));
  }, []);

  // Clear text
  const handleClear = () => {
    setState({
      words: [],
      currentIndex: 0,
      isPlaying: false,
      isFullscreen: false,
      text: "",
      fileName: "",
      documentId: null,
    });
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Listener para mudança de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setState((prev) => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement,
      }));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "KeyR") {
        handleReset();
      } else if (e.code === "KeyF") {
        toggleFullscreen();
      } else if (e.code === "Escape" && state.isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isFullscreen, togglePlay, handleReset, toggleFullscreen]);

  // Obter palavras atuais para exibição
  const getCurrentWords = (): string => {
    if (state.words.length === 0) return "";

    const words = state.words.slice(
      state.currentIndex,
      state.currentIndex + settings.wordsPerDisplay
    );
    return words.join(" ");
  };

  // Calcular progresso
  const progress =
    state.words.length > 0
      ? Math.min((state.currentIndex / state.words.length) * 100, 100)
      : 0;

  // Atualizar settings
  const updateSettings = (key: keyof RSVPSettings, value: number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Handle slider de progresso
  const handleProgressSliderChange = (value: number[]) => {
    if (state.words.length === 0) return;
    const newIndex = Math.floor((value[0] / 100) * state.words.length);
    setState((prev) => ({
      ...prev,
      currentIndex: Math.max(0, Math.min(newIndex, prev.words.length - 1)),
    }));
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (state.words.length === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newIndex = Math.floor(percentage * state.words.length);

    setState((prev) => ({
      ...prev,
      currentIndex: Math.max(0, Math.min(newIndex, prev.words.length - 1)),
    }));
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col w-full h-full",
        state.isFullscreen && "fixed inset-0 z-50 bg-background"
      )}
    >
      {/* Área de Upload/Biblioteca (quando não há texto) */}
      {state.words.length === 0 && (
        <div className="m-4 space-y-4">
          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text">
                <FileText className="h-5 w-5" />
                Leitor RSVP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 md:p-12 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-text mb-2">
                  Arraste um arquivo ou clique para selecionar
                </p>
                <p className="text-sm text-muted-foreground">
                  Suporta arquivos .txt e .pdf (serão salvos automaticamente)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Biblioteca de documentos salvos */}
          {savedDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-text text-lg">
                  <FolderOpen className="h-5 w-5" />
                  Biblioteca ({savedDocuments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {savedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => loadSavedDocument(doc)}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors group"
                    >
                      <div className="shrink-0 mt-0.5">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-text truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.wordCount} palavras
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(doc.lastReadAt)}
                        </p>
                        {doc.lastPosition > 0 && (
                          <p className="text-xs text-primary">
                            {Math.round((doc.lastPosition / doc.wordCount) * 100)}% lido
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => deleteDocument(doc.id, e)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Área de Leitura */}
      {state.words.length > 0 && (
        <div className="flex-1 flex flex-col">
          {/* Header com info do arquivo */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">
                {state.fileName}
              </span>
              <span className="hidden sm:inline">
                ({state.words.length} palavras)
              </span>
            </div>
            <div className="flex items-center gap-1">
              {!state.documentId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveCurrentDocument}
                  disabled={isSaving}
                  className="h-8"
                  title="Salvar na biblioteca"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Salvar</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLibrary(!showLibrary)}
                className="h-8"
                title="Biblioteca"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Fechar</span>
              </Button>
            </div>
          </div>

          {/* Biblioteca colapsável */}
          {showLibrary && savedDocuments.length > 0 && (
            <div className="border-b bg-muted/50 p-3 max-h-48 overflow-auto scrollable">
              <div className="flex flex-wrap gap-2">
                {savedDocuments.map((doc) => (
                  <Button
                    key={doc.id}
                    variant={state.documentId === doc.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => loadSavedDocument(doc)}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-[100px]">{doc.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Área de Exibição da Palavra */}
          <div
            className={cn(
              "flex-1 flex items-center justify-center bg-background select-none",
              state.isFullscreen
                ? "min-h-screen"
                : "min-h-[200px] sm:min-h-[300px] md:min-h-[400px]"
            )}
            onClick={togglePlay}
          >
            <div
              className="text-center px-4 font-mono tracking-tight"
              style={{ fontSize: `${settings.fontSize}px` }}
            >
              {state.currentIndex < state.words.length ? (
                settings.showORP ? (
                  renderWordWithORP(getCurrentWords(), true)
                ) : (
                  <span className="text-foreground">{getCurrentWords()}</span>
                )
              ) : (
                <span className="text-muted-foreground text-lg sm:text-xl">
                  Leitura concluída! Pressione Reset para recomeçar.
                </span>
              )}
            </div>
          </div>

          {/* Barra de Progresso Visual */}
          <div
            className="h-2 bg-secondary cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Slider de Navegação */}
          <div className="px-4 py-2 bg-card border-t">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12 text-right">
                {state.currentIndex}
              </span>
              <Slider
                value={[progress]}
                onValueChange={handleProgressSliderChange}
                min={0}
                max={100}
                step={0.1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {state.words.length}
              </span>
            </div>
          </div>

          {/* Controles (Desktop) */}
          <div className="hidden md:flex items-center justify-between px-4 py-3 bg-card border-t gap-4">
            {/* Controles de Playback */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                title="Reset (R)"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={togglePlay}
                className="h-12 w-12"
                title="Play/Pause (Espaço)"
              >
                {state.isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                title="Fullscreen (F)"
              >
                {state.isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Progresso textual */}
            <div className="text-sm text-muted-foreground">
              {state.currentIndex} / {state.words.length} (
              {Math.round(progress)}%)
            </div>

            {/* Controles de Velocidade */}
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <Label className="text-sm whitespace-nowrap text-text">
                {settings.wpm} WPM
              </Label>
              <Slider
                value={[settings.wpm]}
                onValueChange={([v]) => updateSettings("wpm", v)}
                min={200}
                max={1000}
                step={25}
                className="flex-1"
              />
            </div>

            {/* Controles Adicionais */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-text">Tamanho:</Label>
                <Select
                  value={String(settings.fontSize)}
                  onValueChange={(v) => updateSettings("fontSize", Number(v))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[24, 32, 40, 48, 56, 64, 72, 80].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}px
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-text">Palavras:</Label>
                <Select
                  value={String(settings.wordsPerDisplay)}
                  onValueChange={(v) =>
                    updateSettings("wordsPerDisplay", Number(v) as 1 | 2)
                  }
                >
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-text">ORP</Label>
                <Switch
                  checked={settings.showORP}
                  onCheckedChange={(v) => updateSettings("showORP", v)}
                />
              </div>
            </div>
          </div>

          {/* Controles (Mobile) - Collapsible */}
          <div className="md:hidden">
            {/* Controles principais fixos */}
            <div className="flex items-center justify-between px-4 py-3 bg-card border-t">
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {state.currentIndex}/{state.words.length}
                </span>
                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlay}
                  className="h-12 w-12"
                >
                  {state.isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                >
                  {state.isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Controles avançados colapsáveis */}
            <Collapsible open={controlsOpen} onOpenChange={setControlsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full h-8 rounded-none border-t flex items-center justify-center gap-1 text-muted-foreground"
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-xs">Configurações</span>
                  {controlsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-card border-t">
                <div className="p-4 space-y-4">
                  {/* Velocidade */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-text">Velocidade</Label>
                      <span className="text-sm text-muted-foreground">
                        {settings.wpm} WPM
                      </span>
                    </div>
                    <Slider
                      value={[settings.wpm]}
                      onValueChange={([v]) => updateSettings("wpm", v)}
                      min={200}
                      max={1000}
                      step={25}
                    />
                  </div>

                  {/* Tamanho do texto */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-text">
                        Tamanho do Texto
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {settings.fontSize}px
                      </span>
                    </div>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={([v]) => updateSettings("fontSize", v)}
                      min={24}
                      max={80}
                      step={4}
                    />
                  </div>

                  {/* Grid de opções */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-text">Palavras</Label>
                      <Select
                        value={String(settings.wordsPerDisplay)}
                        onValueChange={(v) =>
                          updateSettings("wordsPerDisplay", Number(v) as 1 | 2)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 palavra</SelectItem>
                          <SelectItem value="2">2 palavras</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-text">Opções</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            ORP
                          </span>
                          <Switch
                            checked={settings.showORP}
                            onCheckedChange={(v) => updateSettings("showORP", v)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Pausa Pontuação
                          </span>
                          <Switch
                            checked={settings.smartPunctuation}
                            onCheckedChange={(v) =>
                              updateSettings("smartPunctuation", v)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Instruções de atalhos (quando há texto) */}
      {state.words.length > 0 && !state.isFullscreen && (
        <div className="hidden lg:flex items-center justify-center gap-6 py-2 text-xs text-muted-foreground bg-muted/50">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-background border">
              Espaço
            </kbd>{" "}
            Play/Pause
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-background border">R</kbd>{" "}
            Reset
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-background border">F</kbd>{" "}
            Fullscreen
          </span>
          <span>Clique na área de leitura para Play/Pause</span>
        </div>
      )}
    </div>
  );
}
