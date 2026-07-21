import { DataGrid, type DataGridProps, type GridColDef, type GridValidRowModel } from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import { Paper } from '@mui/material';

const DEFAULT_PAGE_SIZE = 25;

export type { GridColDef, GridValidRowModel };

export function EnhancedDataGrid<T extends GridValidRowModel>(props: DataGridProps<T>) {
  return (
    <Paper sx={{ overflowX: 'auto', height: '100%', width: '100%' }}>
      <DataGrid
        {...props}
        localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
        initialState={{
          pagination: {
            paginationModel: { pageSize: DEFAULT_PAGE_SIZE, page: 0 },
          },
          ...props.initialState,
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
        density="compact"
        sx={{
          border: 'none',
          '& .MuiDataGrid-cell:focus': { outline: 'none' },
          '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
          ...props.sx,
        }}
      />
    </Paper>
  );
}
