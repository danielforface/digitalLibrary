
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Bold, Italic, Link, List, Quote, Code, Strikethrough, AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut, ClipboardPaste } from "lucide-react";
import React from "react";
import TurndownService from 'turndown';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator";
import type { ArchiveItem } from "@/lib/types"
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE_MB = 250;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const fileSchema = z.any()
    .optional()
    .refine((value) => {
        if (value instanceof FileList && value.length > 0) {
            return value[0].size <= MAX_FILE_SIZE_BYTES;
        }
        return true;
    }, `File size must be less than ${MAX_FILE_SIZE_MB}MB.`);

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  category: z.string().min(1, "Category is required."),
  description: z.string().min(1, "Description is required."),
  type: z.enum(["text", "image", "audio", "video", "pdf", "word"]),
  content: z.string().optional(),
  file: fileSchema,
  tags: z.string().optional(),
  coverImage: fileSchema,
  removeCoverImage: z.boolean().default(false).optional(),
});

export type UploadFormData = z.infer<typeof formSchema>;

type UploadFormProps = {
  onSubmit: (data: UploadFormData) => void;
  itemToEdit?: ArchiveItem;
  allCategories: string[];
  onDone: () => void;
  isSubmitting: boolean;
};

export default function UploadForm({ onSubmit, itemToEdit, allCategories, onDone, isSubmitting }: UploadFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  const form = useForm<UploadFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: itemToEdit?.title || "",
      category: itemToEdit?.category || "",
      description: itemToEdit?.description || "",
      type: itemToEdit?.type || "text",
      content: itemToEdit?.content || "",
      file: undefined,
      tags: itemToEdit?.tags?.join(', ') || "",
      coverImage: undefined,
      removeCoverImage: false,
    },
  });

  const selectedType = form.watch("type");
  const removeCoverImage = form.watch("removeCoverImage");

  const getAcceptAttribute = (type: 'main' | 'cover') => {
    if (type === 'cover') return 'image/*';

    switch (selectedType) {
      case 'image':
        return 'image/*';
      case 'audio':
        return 'audio/mp3,audio/m4a,audio/mpeg';
      case 'video':
        return 'video/*';
      case 'pdf':
        return 'application/pdf';
      case 'word':
        return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return '';
    }
  };
  
  const handleFinalSubmit = (data: UploadFormData) => {
    const apiFormData = new FormData();

    // Loop through form data and append to FormData object
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'file' || key === 'coverImage') {
        if (value instanceof FileList && value.length > 0) {
          apiFormData.append(key, value[0]);
        }
      } else if (key === 'removeCoverImage') {
         if (value) apiFormData.append(key, 'true');
      } else if (value !== undefined && value !== null) {
        apiFormData.append(key, String(value));
      }
    });
    onSubmit(apiFormData as any);
  };

  const applyInlineFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.selectionStart === textarea.selectionEnd) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = `${prefix}${selectedText}${suffix}`;
    
    const updatedValue = 
        textarea.value.substring(0, start) + 
        newText + 
        textarea.value.substring(end);

    form.setValue("content", updatedValue, { shouldValidate: true, shouldDirty: true });

    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };
  
  const applyBlockFormatting = (className: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const value = textarea.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = value.indexOf('\n', start);
    if (lineEnd === -1) {
        lineEnd = value.length;
    }

    let lineText = value.substring(lineStart, lineEnd);
    
    const newText = `<div class="${className}">${lineText}</div>`;
    
    const updatedValue = 
        value.substring(0, lineStart) + 
        newText + 
        value.substring(lineEnd);

    form.setValue("content", updatedValue, { shouldValidate: true, shouldDirty: true });

    setTimeout(() => {
        textarea.focus();
        const newPos = start + `<div class="${className}">`.length;
        textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }

  const handleLinkClick = () => {
    const url = window.prompt("Enter the URL:");
    if (!url) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end) || 'link text';
    const newText = `[${selectedText}](${url})`;
    
    const updatedValue = 
        textarea.value.substring(0, start) + 
        newText + 
        textarea.value.substring(end);

    form.setValue("content", updatedValue, { shouldValidate: true, shouldDirty: true });

    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1 + selectedText.length);
    }, 0);
  };

  const handleListClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    const listItems = selectedText
      .split('\n')
      .map(line => `* ${line}`)
      .join('\n');
    
    const updatedValue = 
        textarea.value.substring(0, start) + 
        listItems + 
        textarea.value.substring(end);

    form.setValue("content", updatedValue, { shouldValidate: true, shouldDirty: true });
     setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + listItems.length);
    }, 0);
  };

  const handlePasteFromWord = async () => {
    if (!navigator.clipboard?.read) {
        toast({
            variant: "destructive",
            title: t('error'),
            description: t('clipboard_api_not_supported'),
        });
        return;
    }

    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            if (item.types.includes("text/html")) {
                const blob = await item.getType("text/html");
                const htmlContent = await blob.text();

                const turndownService = new TurndownService();
                const markdown = turndownService.turndown(htmlContent);

                const textarea = textareaRef.current;
                if(textarea){
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const currentValue = form.getValues("content") || "";

                    const updatedValue = 
                        currentValue.substring(0, start) + 
                        markdown + 
                        currentValue.substring(end);

                    form.setValue("content", updatedValue, { shouldValidate: true, shouldDirty: true });
                    
                    setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(start + markdown.length, start + markdown.length);
                    }, 0);
                } else {
                    form.setValue("content", markdown, { shouldValidate: true, shouldDirty: true });
                }
                
                toast({ title: t('paste_successful'), description: t('paste_from_word_success_desc') });
                return;
            }
        }
        
        toast({
            variant: "destructive",
            title: t('paste_failed'),
            description: t('no_html_in_clipboard'),
        });

    } catch (err) {
        console.error("Failed to read clipboard contents: ", err);
        const error = err as Error;
        
        if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
             toast({
                variant: "destructive",
                title: t('permission_denied'),
                description: t('clipboard_permission_denied_desc'),
            });
        } else {
            toast({
                variant: "destructive",
                title: t('paste_failed'),
                description: t('unexpected_clipboard_error'),
            });
        }
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFinalSubmit)} className="space-y-8 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form_title')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form_title_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form_file_type')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form_file_type_placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="text">{t('text')}</SelectItem>
                    <SelectItem value="image">{t('image')}</SelectItem>
                    <SelectItem value="audio">{t('audio')}</SelectItem>
                    <SelectItem value="video">{t('video')}</SelectItem>
                    <SelectItem value="pdf">{t('pdf')}</SelectItem>
                    <SelectItem value="word">{t('word')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form_category')}</FormLabel>
                <Input placeholder={t('form_category_placeholder')} {...field} list="category-suggestions" />
                <datalist id="category-suggestions">
                    {allCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form_description')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form_description_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('form_tags')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form_tags_placeholder')} {...field} />
                </FormControl>
                <FormDescription>
                  {t('form_tags_desc')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {selectedType === 'text' && (
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form_content')}</FormLabel>
                 <div className="rounded-md border border-input">
                    <div className="flex items-center gap-1 border-b border-input p-1 bg-transparent flex-wrap">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Bold" onClick={() => applyInlineFormatting('**')}> <Bold size={16}/> </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Italic" onClick={() => applyInlineFormatting('_')}> <Italic size={16}/> </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Strikethrough" onClick={() => applyInlineFormatting('~~')}> <Strikethrough size={16}/> </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Link" onClick={handleLinkClick}> <Link size={16}/> </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Blockquote" onClick={() => applyInlineFormatting('\n> ', '')}> <Quote size={16}/> </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Code" onClick={() => applyInlineFormatting('`')}> <Code size={16}/> </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Bulleted List" onClick={handleListClick}> <List size={16}/> </Button>
                        <Separator orientation="vertical" className="h-5 mx-1" />
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Align Left" onClick={() => applyBlockFormatting('align-left')}> <AlignLeft size={16}/> </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Align Center" onClick={() => applyBlockFormatting('align-center')}> <AlignCenter size={16}/> </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Align Right" onClick={() => applyBlockFormatting('align-right')}> <AlignRight size={16}/> </Button>
                         <Separator orientation="vertical" className="h-5 mx-1" />
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Increase Font Size" onClick={() => applyInlineFormatting('<big>', '</big>')}> <ZoomIn size={16}/> </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Decrease Font Size" onClick={() => applyInlineFormatting('<small>', '</small>')}> <ZoomOut size={16}/> </Button>
                        <Separator orientation="vertical" className="h-5 mx-1" />
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title={t('paste_from_word')} onClick={handlePasteFromWord}>
                            <ClipboardPaste size={16}/>
                        </Button>
                    </div>
                    <FormControl>
                    <Textarea
                        placeholder={t('form_content_placeholder')}
                        {...field}
                        ref={el => {
                            field.ref(el);
                            (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                        }}
                        className="min-h-[150px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    </FormControl>
                </div>
                <FormDescription>
                  {t('form_content_desc')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType !== 'text' && (
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form_main_file')}</FormLabel>
                <FormControl>
                  <Input 
                    type="file"
                    accept={getAcceptAttribute('main')}
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                </FormControl>
                <FormDescription>
                  {itemToEdit?.url ? t('form_main_file_desc_edit') : t('form_main_file_desc_new')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="md:col-span-2 space-y-4 rounded-lg border p-4">
            <h3 className="text-lg font-medium">{t('form_cover_photo')}</h3>
            {itemToEdit?.coverImageUrl && (
                <FormField
                    control={form.control}
                    name="removeCoverImage"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        </FormControl>
                        <FormLabel className="font-normal">
                            {t('form_remove_cover_photo')}
                        </FormLabel>
                    </FormItem>
                    )}
                />
            )}
            <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('form_upload_photo')}</FormLabel>
                    <FormControl>
                    <Input 
                        type="file"
                        accept={getAcceptAttribute('cover')}
                        onChange={(e) => field.onChange(e.target.files)}
                        disabled={removeCoverImage}
                    />
                    </FormControl>
                    <FormDescription>
                    {itemToEdit?.coverImageUrl ? t('form_upload_photo_desc_edit') : t('form_upload_photo_desc_new')}
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onDone} disabled={isSubmitting}>{t('cancel')}</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {itemToEdit ? t('save_changes') : t('add_to_archive')}
            </Button>
        </div>
      </form>
    </Form>
  )
}
