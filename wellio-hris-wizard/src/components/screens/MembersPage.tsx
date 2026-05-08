import {
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddIcon from '@mui/icons-material/Add';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// ─── Types ───────────────────────────────────────────────────────────────────

type AccessLevel = 'Miembro' | 'Titular de la cuenta';
type MemberStatus = 'Activo' | 'Inactivo';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  access: AccessLevel;
  legajo: number;
  joinDate: string;
  status: MemberStatus;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MEMBERS: Member[] = [
  { id: '1', firstName: 'Evelyn', lastName: 'Yañez', email: 'evelyn@fktech.net', access: 'Miembro', legajo: 7, joinDate: '08/01/2025', status: 'Activo' },
  { id: '2', firstName: 'Adrian', lastName: 'Cardoso Simoes', email: 'adrian@fktech.net', access: 'Miembro', legajo: 3, joinDate: '04/01/2025', status: 'Activo' },
  { id: '3', firstName: 'Álvaro', lastName: 'Cuadro', email: 'cuadro@fktech.net', access: 'Miembro', legajo: 2, joinDate: '03/01/2025', status: 'Activo' },
  { id: '4', firstName: 'Roxana', lastName: 'Sentinelli', email: 'roxana@fktech.net', access: 'Miembro', legajo: 1, joinDate: '02/01/2025', status: 'Activo' },
  { id: '5', firstName: 'Lautaro', lastName: 'Riveros', email: 'riveros@fktech.net', access: 'Miembro', legajo: 6, joinDate: '07/01/2025', status: 'Activo' },
  { id: '6', firstName: 'Roxana Pruebas de los Dolores', lastName: 'Sentinelli Villaba', email: 't1821841@gmail.com', access: 'Titular de la cuenta', legajo: 1111, joinDate: '01/07/2025', status: 'Activo' },
  { id: '7', firstName: 'Antonelia', lastName: 'Rodriguez', email: 'rodriguez@fktech.net', access: 'Miembro', legajo: 4, joinDate: '05/01/2025', status: 'Activo' },
];

const SORTABLE_COLUMNS = ['Nombre', 'Apellido', 'Mail', 'Acceso', 'Legajo', 'Fecha de ingreso', 'Estado'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MemberAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <Avatar
      sx={{
        width: 40,
        height: 40,
        bgcolor: 'primary.light',
        color: 'primary.main',
        fontSize: '13px',
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {getInitials(firstName, lastName)}
    </Avatar>
  );
}

function AccessChip({ access }: { access: AccessLevel }) {
  const isOwner = access === 'Titular de la cuenta';
  return (
    <Chip
      label={access}
      size="small"
      variant="outlined"
      sx={{
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        height: 26,
        color: isOwner ? 'secondary.main' : 'info.main',
        borderColor: isOwner ? 'secondary.main' : 'info.main',
        bgcolor: isOwner ? '#FED7AA33' : '#DBEAFE55',
      }}
    />
  );
}

function StatusChip({ status }: { status: MemberStatus }) {
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        height: 26,
        bgcolor: 'success.light',
        color: 'success.dark',
      }}
    />
  );
}

function SortableHeader({ label }: { label: string }) {
  const sortable = SORTABLE_COLUMNS.includes(label);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, userSelect: 'none' }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, fontSize: '13px', color: '#374151', fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </Typography>
      {sortable && (
        <>
          <SwapVertIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
          <MoreVertIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
        </>
      )}
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MembersPage() {
  return (
    <Box
      sx={{
        bgcolor: '#F0EDF9',
        minHeight: '100vh',
        p: { xs: 2, sm: 3, md: 4 },
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ── Page header ── */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: '#1A1A2E', mb: 0.5, fontFamily: 'Inter, sans-serif' }}
        >
          Miembros
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}
        >
          Aquí podrás ver el listado de las personas que forman parte de tu organización
        </Typography>
      </Box>

      {/* ── Table card ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
            px: 3,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <IconButton size="small" sx={{ color: '#6B7280' }}>
            <SearchIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton size="small" sx={{ color: '#6B7280' }}>
            <TuneIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton size="small" sx={{ color: '#6B7280' }}>
            <ViewColumnIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Button
            variant="outlined"
            startIcon={<UploadFileIcon sx={{ fontSize: 16 }} />}
            size="small"
            sx={{
              ml: 1,
              borderColor: '#D1D5DB',
              color: '#374151',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'none',
              '&:hover': { borderColor: '#9CA3AF', bgcolor: '#F9FAFB' },
            }}
          >
            Subir archivo
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            size="small"
            sx={{
              bgcolor: '#E5E7EB',
              color: '#374151',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#D1D5DB', boxShadow: 'none' },
            }}
          >
            Nuevo miembro
          </Button>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F3F0FA' }}>
                {['Foto', 'Nombre', 'Apellido', 'Mail', 'Acceso', 'Legajo', 'Fecha de ingreso', 'Estado'].map(
                  (header) => (
                    <TableCell
                      key={header}
                      sx={{
                        py: 1.5,
                        px: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <SortableHeader label={header} />
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {MOCK_MEMBERS.map((member, idx) => (
                <TableRow
                  key={member.id}
                  sx={{
                    bgcolor: idx % 2 === 0 ? 'background.paper' : '#FAFAFA',
                    '&:hover': { bgcolor: '#F3F0FA' },
                    transition: 'background-color 150ms ease',
                    cursor: 'pointer',
                  }}
                >
                  <TableCell sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6' }}>
                    <MemberAvatar firstName={member.firstName} lastName={member.lastName} />
                  </TableCell>
                  <TableCell
                    sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#111827' }}
                  >
                    {member.firstName}
                  </TableCell>
                  <TableCell
                    sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#111827' }}
                  >
                    {member.lastName}
                  </TableCell>
                  <TableCell
                    sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}
                  >
                    {member.email}
                  </TableCell>
                  <TableCell sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6' }}>
                    <AccessChip access={member.access} />
                  </TableCell>
                  <TableCell
                    sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#111827' }}
                  >
                    {member.legajo}
                  </TableCell>
                  <TableCell
                    sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#111827' }}
                  >
                    {member.joinDate}
                  </TableCell>
                  <TableCell sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6' }}>
                    <StatusChip status={member.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
