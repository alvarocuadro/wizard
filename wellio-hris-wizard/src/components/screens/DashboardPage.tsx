import { Box, Typography, Avatar, Chip, Button, Card, CardContent } from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedPost {
  id: string;
  content: string;
  timestamp: string;
  reactions: { emoji: string; count: number }[];
}

interface Birthday {
  initials: string;
  name: string;
  date: string;
}

interface NewHire {
  initials: string;
  name: string;
}

interface Holiday {
  displayDate: string;
  description: string;
  type: string;
  daysUntil: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FEED: FeedPost[] = [
  { id: '1', content: 'voy a hacer un cambio', timestamp: '30/04 00:55', reactions: [{ emoji: '🔥', count: 2 }] },
  { id: '2', content: 'dfggfgf', timestamp: '29/04 09:57', reactions: [] },
  { id: '3', content: 'fdgshghs', timestamp: '29/04 09:35', reactions: [] },
];

const MOCK_BIRTHDAYS: Birthday[] = [
  { initials: 'PT', name: 'Prueba2 Telefono', date: '11 de mayo' },
  { initials: 'JP', name: 'Juan De Los Palotes', date: '29 de agosto' },
  { initials: 'LL', name: 'Leonardo Lucotti', date: '8 de septiembre' },
  { initials: 'AC', name: 'Alejandra Chappaz', date: '20 de septiembre' },
];

const MOCK_NEW_HIRES: NewHire[] = [{ initials: 'AD', name: 'Anto Diseño' }];

const MOCK_HOLIDAY: Holiday = {
  displayDate: '25 de Mayo',
  description: 'Día de la independencia',
  type: 'Feriado',
  daysUntil: 17,
};

// ─── Shared token shortcuts ───────────────────────────────────────────────────

const FONT = 'Inter, sans-serif';

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeedCard({ post }: { post: FeedPost }) {
  return (
    <Card
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Typography
          variant="body2"
          sx={{ color: '#111827', mb: 2.5, lineHeight: 1.6, fontFamily: FONT }}
        >
          {post.content}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {post.reactions.map((r, i) => (
              <Chip
                key={i}
                label={`${r.emoji} ${r.count}`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: FONT,
                  height: 24,
                  borderColor: '#F59E0B',
                  color: '#D97706',
                  bgcolor: '#FEF3C7',
                }}
              />
            ))}
          </Box>
          <Typography
            variant="caption"
            sx={{ color: '#9CA3AF', fontFamily: FONT }}
          >
            {post.timestamp}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
          <SentimentSatisfiedAltIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontFamily: FONT }}>
            +
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              fontFamily: FONT,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Comentarios
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function BirthdaysWidget({ birthdays }: { birthdays: Birthday[] }) {
  return (
    <Card
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography
            sx={{ fontWeight: 700, fontSize: '16px', color: 'primary.main', fontFamily: FONT }}
          >
            Próximos cumpleaños
          </Typography>
          <Typography sx={{ fontSize: '22px', lineHeight: 1 }}>🎁</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {birthdays.map((b) => (
            <Box key={b.initials} sx={{ textAlign: 'center', minWidth: 64 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#6B7280',
                  display: 'block',
                  mb: 1,
                  fontSize: '11px',
                  fontFamily: FONT,
                  lineHeight: 1.3,
                }}
              >
                {b.date}
              </Typography>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: FONT,
                  mx: 'auto',
                  mb: 0.75,
                }}
              >
                {b.initials}
              </Avatar>
              <Typography
                sx={{
                  fontSize: '11px',
                  color: '#6B7280',
                  fontFamily: FONT,
                  lineHeight: 1.3,
                  textAlign: 'center',
                }}
              >
                {b.name}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography sx={{ fontSize: '24px', mt: 2, lineHeight: 1 }}>🎈🎈</Typography>
      </CardContent>
    </Card>
  );
}

function NewHiresWidget({ hires }: { hires: NewHire[] }) {
  return (
    <Card
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Typography
          sx={{ fontWeight: 700, fontSize: '16px', color: 'primary.main', fontFamily: FONT, mb: 2 }}
        >
          Nuevos ingresos
        </Typography>

        <Chip
          icon={<SentimentSatisfiedAltIcon sx={{ fontSize: '16px !important' }} />}
          label="Le damos la bienvenida a:"
          size="small"
          sx={{
            bgcolor: 'success.light',
            color: 'success.dark',
            fontWeight: 600,
            borderRadius: '999px',
            fontFamily: FONT,
            fontSize: '12px',
            mb: 2.5,
            height: 28,
            '& .MuiChip-icon': { color: 'success.main' },
          }}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          {hires.map((h) => (
            <Box key={h.initials} sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  fontWeight: 700,
                  fontFamily: FONT,
                  mx: 'auto',
                  mb: 0.75,
                }}
              >
                {h.initials}
              </Avatar>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#111827', fontFamily: FONT }}
              >
                {h.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

function HolidayWidget({ holiday }: { holiday: Holiday }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Typography
          sx={{ fontWeight: 700, fontSize: '16px', color: 'primary.main', fontFamily: FONT, mb: 2 }}
        >
          Próximo feriado
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flex: 1 }}>
            {/* Calendar icon */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CalendarMonthIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </Box>

            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: '#111827', fontFamily: FONT, mb: 0.25 }}
              >
                {holiday.displayDate}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#6B7280', fontFamily: FONT, display: 'block', mb: 0.75 }}
              >
                {holiday.description}
              </Typography>
              <Chip
                label={holiday.type}
                size="small"
                sx={{
                  bgcolor: 'warning.light',
                  color: 'warning.dark',
                  fontWeight: 600,
                  borderRadius: '999px',
                  fontFamily: FONT,
                  fontSize: '11px',
                  height: 20,
                }}
              />
            </Box>
          </Box>

          {/* Countdown */}
          <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: '#111827', fontFamily: FONT, lineHeight: 1 }}
            >
              {holiday.daysUntil}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: FONT }}>
              Días
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  userName?: string;
}

export function DashboardPage({ userName = 'Alvaro de los Dolores Cuadro Schumacher Schwarzenegger' }: DashboardPageProps) {
  return (
    <Box
      sx={{
        bgcolor: '#F9FAFB',
        minHeight: '100vh',
        p: { xs: 2, sm: 3, md: 4 },
        fontFamily: FONT,
      }}
    >
      {/* ── Page header ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 4,
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#1A1A2E',
              fontFamily: FONT,
              lineHeight: 1.25,
              mb: 0.5,
            }}
          >
            ¡Hola {userName}!
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', fontFamily: FONT }}>
            Estas son las últimas novedades
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<StarBorderIcon sx={{ fontSize: 16 }} />}
          size="small"
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 700,
            fontFamily: FONT,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            px: 2,
            py: 1,
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          UI-KIT
        </Button>
      </Box>

      {/* ── Two-column layout ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        {/* Left: Activity feed */}
        <Box>
          {MOCK_FEED.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </Box>

        {/* Right: Widgets */}
        <Box>
          <BirthdaysWidget birthdays={MOCK_BIRTHDAYS} />
          <NewHiresWidget hires={MOCK_NEW_HIRES} />
          <HolidayWidget holiday={MOCK_HOLIDAY} />
        </Box>
      </Box>
    </Box>
  );
}
