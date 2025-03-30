import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  Paper, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Send as SendIcon,
  Reply as ReplyIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { db } from '../../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  Timestamp,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const CommentBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));

const CommentForm = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const CommentActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: theme.spacing(1),
}));

const MentionChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.light,
  '& .MuiChip-label': {
    color: theme.palette.primary.contrastText,
  },
}));

const formatDate = (date) => {
  if (!date) return '';
  return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
};

const TestCommentSection = ({ testCaseId, projectId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState([]);
  const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const commentRef = useRef(null);

  // Carregar comentários
  useEffect(() => {
    if (!testCaseId) return;

    const commentsRef = collection(db, 'testComments');
    const q = query(
      commentsRef, 
      where('testCaseId', '==', testCaseId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      setComments(commentsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [testCaseId]);

  // Carregar membros do projeto para menções
  useEffect(() => {
    if (!projectId) return;

    const fetchProjectMembers = async () => {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists() && projectDoc.data().members) {
          setProjectMembers(projectDoc.data().members);
        }
      } catch (error) {
        console.error('Erro ao carregar membros do projeto:', error);
      }
    };

    fetchProjectMembers();
  }, [projectId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const commentData = {
        testCaseId,
        projectId,
        text: newComment,
        createdBy: {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          photoURL: user.photoURL || null,
        },
        createdAt: Timestamp.now(),
        mentions: extractMentions(newComment),
        replyTo: replyTo,
      };

      // Adicionar comentário
      await addDoc(collection(db, 'testComments'), commentData);
      
      // Enviar notificações para usuários mencionados
      if (commentData.mentions.length > 0) {
        for (const userId of commentData.mentions) {
          await addDoc(collection(db, 'notifications'), {
            userId,
            type: 'mention',
            message: `${user.name || user.email} mencionou você em um comentário`,
            relatedTo: {
              type: 'testCase',
              id: testCaseId,
            },
            read: false,
            createdAt: Timestamp.now(),
          });
        }
      }

      // Limpar formulário
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  // Extrair menções do texto (formato @userId)
  const extractMentions = (text) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]); // ID do usuário
    }
    
    return mentions;
  };

  const handleReply = (comment) => {
    setReplyTo(comment.id);
    setNewComment(`@[${comment.createdBy.name}](${comment.createdBy.id}) `);
    commentRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setNewComment('');
  };

  // Gerenciar menções
  const handleCommentChange = (e) => {
    const value = e.target.value;
    setNewComment(value);
    
    // Verificar se o usuário está digitando uma menção
    const curPos = e.target.selectionStart;
    setCursorPosition(curPos);
    
    const textBeforeCursor = value.substring(0, curPos);
    const mentionMatch = textBeforeCursor.match(/@([^@]*)$/);
    
    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setMentionAnchorEl(e.target);
    } else {
      setMentionAnchorEl(null);
    }
  };

  const handleMentionSelect = (member) => {
    const textBeforeMention = newComment.substring(0, cursorPosition).replace(/@[^@]*$/, '');
    const textAfterMention = newComment.substring(cursorPosition);
    
    const mentionText = `@[${member.name}](${member.userId}) `;
    setNewComment(textBeforeMention + mentionText + textAfterMention);
    
    setMentionAnchorEl(null);
    setTimeout(() => commentRef.current?.focus(), 100);
  };

  const filteredMembers = projectMembers.filter(member => 
    member.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const renderCommentItem = (comment) => {
    // Substituir menções por chips no texto exibido
    const renderMentions = (text) => {
      if (!text) return '';
      
      const parts = [];
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      let lastIndex = 0;
      let match;
      
      while ((match = mentionRegex.exec(text)) !== null) {
        // Texto antes da menção
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        
        // Menção como chip
        parts.push(
          <MentionChip
            key={`${match[2]}-${match.index}`}
            label={match[1]}
            size="small"
            icon={<PersonIcon fontSize="small" />}
          />
        );
        
        lastIndex = match.index + match[0].length;
      }
      
      // Texto restante após a última menção
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      
      return parts;
    };

    return (
      <CommentBox key={comment.id} elevation={1}>
        <Box display="flex" alignItems="center" mb={1}>
          <ListItemAvatar>
            <Avatar 
              src={comment.createdBy.photoURL}
              alt={comment.createdBy.name}
            >
              {comment.createdBy.name?.charAt(0) || comment.createdBy.email?.charAt(0)}
            </Avatar>
          </ListItemAvatar>
          <Box>
            <Typography variant="subtitle2">
              {comment.createdBy.name || comment.createdBy.email}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatDate(comment.createdAt)}
            </Typography>
          </Box>
        </Box>
        
        {comment.replyTo && (
          <Box ml={2} mb={1} pl={1} borderLeft="3px solid" borderColor="divider">
            <Typography variant="body2" color="textSecondary">
              Em resposta a um comentário
            </Typography>
          </Box>
        )}
        
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
          {renderMentions(comment.text)}
        </Typography>
        
        <Box display="flex" justifyContent="flex-end">
          <Button
            startIcon={<ReplyIcon />}
            size="small"
            onClick={() => handleReply(comment)}
          >
            Responder
          </Button>
        </Box>
      </CommentBox>
    );
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Comentários e Discussões
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {comments.length > 0 ? (
        <List sx={{ mb: 4 }}>
          {comments.map(renderCommentItem)}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </Typography>
      )}
      
      <CommentForm>
        {replyTo && (
          <Box 
            p={1} 
            mb={1} 
            bgcolor="action.selected" 
            borderRadius={1}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2">
              Respondendo a um comentário
            </Typography>
            <Button size="small" onClick={handleCancelReply}>
              Cancelar
            </Button>
          </Box>
        )}
        
        <TextField
          inputRef={commentRef}
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          placeholder="Escreva um comentário... Use @ para mencionar alguém"
          value={newComment}
          onChange={handleCommentChange}
        />
        
        <CommentActions>
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleAddComment}
            disabled={!newComment.trim()}
          >
            Comentar
          </Button>
        </CommentActions>
      </CommentForm>
      
      <Menu
        anchorEl={mentionAnchorEl}
        open={Boolean(mentionAnchorEl)}
        onClose={() => setMentionAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <MenuItem 
              key={member.userId} 
              onClick={() => handleMentionSelect(member)}
            >
              <ListItemAvatar>
                <Avatar>
                  {member.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={member.name} secondary={member.email} />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <ListItemText primary="Nenhum membro encontrado" />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default TestCommentSection; 