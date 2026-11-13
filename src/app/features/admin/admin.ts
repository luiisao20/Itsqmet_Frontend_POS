import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatoService } from '../../service/plato-service';
import { MesaService } from '../../service/mesa-service';
import { FacturaService } from '../../service/factura-service';
import { UsuarioService } from '../../service/usuario-service';
import { InsumoService } from '../../service/insumo-service';
import { DistribuidorService } from '../../service/distribuidor-service';
import { ClienteService } from '../../service/cliente-service';
import { TurnoService } from '../../service/turno-service';

import { AreaImpresion, CategoriaPlato, Plato } from '../../models/plato';
import { EstadoMesa, Mesa } from '../../models/mesa';
import { Usuario } from '../../models/usuario';
import { RolUsuario, TipoIdentificacion } from '../../models/auth';
import { Insumo, UnidadMedida } from '../../models/insumo';
import { Distribuidor } from '../../models/distribuidor';
import { Cliente } from '../../models/cliente';
import { Turno } from '../../models/turno';

import { Badge } from '../../shared/badge/badge';
import { Button } from '../../shared/button/button';
import { Modal } from '../../shared/modal/modal';

export type AdminTab = 'platos' | 'categorias' | 'mesas' | 'usuarios' | 'insumos' | 'distribuidores' | 'clientes' | 'turnos';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal],
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  private platoService = inject(PlatoService);
  private mesaService = inject(MesaService);
  private facturaService = inject(FacturaService);
  private usuarioService = inject(UsuarioService);
  private insumoService = inject(InsumoService);
  private distribuidorService = inject(DistribuidorService);
  private clienteService = inject(ClienteService);
  private turnoService = inject(TurnoService);

  activeTab = signal<AdminTab>('platos');
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  // Totales / Métricas
  platos = signal<Plato[]>([]);
  categorias = signal<CategoriaPlato[]>([]);
  mesas = signal<Mesa[]>([]);
  usuarios = signal<Usuario[]>([]);
  insumos = signal<Insumo[]>([]);
  distribuidores = signal<Distribuidor[]>([]);
  clientes = signal<Cliente[]>([]);
  totalFacturas = signal<number>(0);
  turnos = signal<Turno[]>([]);

  // Filtros
  searchTerm = signal<string>('');

  // Modales
  platoModalOpen = signal<boolean>(false);
  editPlatoId = signal<number | null>(null);
  platoForm = signal({
    nombre: '',
    descripcion: '',
    precioUnitario: 0,
    idCategoria: 1,
    aplicaIva: true,
    disponible: true,
    urlImagen: '',
  });

  categoriaModalOpen = signal<boolean>(false);
  editCategoriaId = signal<number | null>(null);
  categoriaForm = signal<{ nombre: string; areaImpresion: AreaImpresion; ordenVisual: number }>({
    nombre: '',
    areaImpresion: 'COCINA',
    ordenVisual: 1,
  });

  mesaModalOpen = signal<boolean>(false);
  editMesaId = signal<number | null>(null);
  mesaForm = signal<{ numeroMesa: number; capacidad: number; ubicacion: string; estado: EstadoMesa }>({
    numeroMesa: 1,
    capacidad: 4,
    ubicacion: 'Salón Principal',
    estado: 'LIBRE',
  });

  usuarioModalOpen = signal<boolean>(false);
  editUsuarioUuid = signal<string | null>(null);
  usuarioForm = signal<{
    nombre: string;
    apellido: string;
    cedula: string;
    email: string;
    password: string;
    rol: RolUsuario;
    activo: boolean;
  }>({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    password: '',
    rol: 'MESERO',
    activo: true,
  });

  insumoModalOpen = signal<boolean>(false);
  editInsumoId = signal<number | null>(null);
  insumoForm = signal<{
    nombre: string;
    unidadMedida: UnidadMedida;
    stockActual: number;
    stockMinimo: number;
    costoPromedio: number;
  }>({
    nombre: '',
    unidadMedida: 'UNIDAD',
    stockActual: 10,
    stockMinimo: 5,
    costoPromedio: 1.0,
  });

  distribuidorModalOpen = signal<boolean>(false);
  editDistribuidorId = signal<number | null>(null);
  distribuidorForm = signal({
    ruc: '',
    razonSocial: '',
    nombreContacto: '',
    telefono: '',
    email: '',
    direccion: '',
    categoriaProveedor: 'General',
    esProveedorLocal: false,
  });

  clienteModalOpen = signal<boolean>(false);
  editClienteUuid = signal<string | null>(null);
  clienteForm = signal<{
    tipoIdentificacion: TipoIdentificacion;
    identificacion: string;
    razonSocial: string;
    email: string;
    telefono: string;
    direccion: string;
  }>({
    tipoIdentificacion: 'CEDULA',
    identificacion: '',
    razonSocial: '',
    email: '',
    telefono: '',
    direccion: '',
  });

  ngOnInit(): void {
    this.loadAll();
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    this.searchTerm.set('');
  }

  loadAll(): void {
    this.loading.set(true);
    this.loadCategorias();
    this.loadPlatos();
    this.loadMesas();
    this.loadUsuarios();
    this.loadInsumos();
    this.loadDistribuidores();
    this.loadClientes();
    this.loadTurnos();

    this.facturaService.getFacturas().subscribe({
      next: (res) => this.totalFacturas.set(res.totalElements),
      error: () => {},
    });
  }

  // --- PLATOS ---
  loadPlatos(): void {
    this.platoService.getPlatos(0, 100).subscribe({
      next: (res) => {
        this.platos.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCrearPlato(): void {
    this.editPlatoId.set(null);
    const catId = this.categorias().length > 0 ? this.categorias()[0].id : 1;
    this.platoForm.set({
      nombre: '',
      descripcion: '',
      precioUnitario: 0,
      idCategoria: catId,
      aplicaIva: true,
      disponible: true,
      urlImagen: '',
    });
    this.platoModalOpen.set(true);
  }

  openEditarPlato(p: Plato): void {
    this.editPlatoId.set(p.id);
    this.platoForm.set({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precioUnitario: p.precioUnitario,
      idCategoria: p.idCategoria,
      aplicaIva: p.aplicaIva,
      disponible: p.disponible,
      urlImagen: p.urlImagen || '',
    });
    this.platoModalOpen.set(true);
  }

  toggleDisponibilidad(plato: Plato): void {
    const updated = !plato.disponible;
    this.platoService.updatePlato(plato.id, { disponible: updated }).subscribe({
      next: () => {
        plato.disponible = updated;
      },
      error: (e) => alert(e.error?.message || 'Error al actualizar disponibilidad'),
    });
  }

  onSubmitPlato(): void {
    const f = this.platoForm();
    if (!f.nombre.trim() || f.precioUnitario <= 0) {
      alert('Ingresa un nombre y precio válido');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      idCategoria: Number(f.idCategoria),
      nombre: f.nombre.trim(),
      descripcion: f.descripcion.trim() || undefined,
      precioUnitario: Number(f.precioUnitario),
      aplicaIva: f.aplicaIva,
      disponible: f.disponible,
      urlImagen: f.urlImagen.trim() || undefined,
    };

    const action$ = this.editPlatoId()
      ? this.platoService.updatePlato(this.editPlatoId()!, req)
      : this.platoService.createPlato(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.platoModalOpen.set(false);
        this.loadPlatos();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al procesar el plato');
      },
    });
  }

  deletePlato(p: Plato): void {
    if (!confirm(`¿Eliminar el plato "${p.nombre}"?`)) return;
    this.platoService.deletePlato(p.id).subscribe({
      next: () => this.loadPlatos(),
      error: (e) => alert(e.error?.message || 'Error al eliminar plato'),
    });
  }

  // --- CATEGORÍAS ---
  loadCategorias(): void {
    this.platoService.getCategorias().subscribe({
      next: (res: any) => {
        const items = res.content ? res.content : (Array.isArray(res) ? res : []);
        this.categorias.set(items);
      },
      error: () => {},
    });
  }

  openCrearCategoria(): void {
    this.editCategoriaId.set(null);
    this.categoriaForm.set({
      nombre: '',
      areaImpresion: 'COCINA',
      ordenVisual: (this.categorias().length + 1),
    });
    this.categoriaModalOpen.set(true);
  }

  openEditarCategoria(c: CategoriaPlato): void {
    this.editCategoriaId.set(c.id);
    this.categoriaForm.set({
      nombre: c.nombre,
      areaImpresion: c.areaImpresion,
      ordenVisual: c.ordenVisual || 1,
    });
    this.categoriaModalOpen.set(true);
  }

  onSubmitCategoria(): void {
    const f = this.categoriaForm();
    if (!f.nombre.trim()) {
      alert('Ingresa el nombre de la categoría');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      nombre: f.nombre.trim(),
      areaImpresion: f.areaImpresion,
      ordenVisual: Number(f.ordenVisual),
    };

    const action$ = this.editCategoriaId()
      ? this.platoService.updateCategoria(this.editCategoriaId()!, req)
      : this.platoService.createCategoria(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.categoriaModalOpen.set(false);
        this.loadCategorias();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar categoría');
      },
    });
  }

  deleteCategoria(c: CategoriaPlato): void {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    this.platoService.deleteCategoria(c.id).subscribe({
      next: () => this.loadCategorias(),
      error: (e) => alert(e.error?.message || 'Error al eliminar categoría'),
    });
  }

  // --- MESAS ---
  loadMesas(): void {
    this.mesaService.getMesas(0, 100).subscribe({
      next: (res) => this.mesas.set(res.content),
      error: () => {},
    });
  }

  openCrearMesa(): void {
    this.editMesaId.set(null);
    const nextNum = this.mesas().length > 0 ? Math.max(...this.mesas().map((m) => m.numeroMesa)) + 1 : 1;
    this.mesaForm.set({
      numeroMesa: nextNum,
      capacidad: 4,
      ubicacion: 'Salón Principal',
      estado: 'LIBRE',
    });
    this.mesaModalOpen.set(true);
  }

  openEditarMesa(m: Mesa): void {
    this.editMesaId.set(m.id);
    this.mesaForm.set({
      numeroMesa: m.numeroMesa,
      capacidad: m.capacidad,
      ubicacion: m.ubicacion || 'Salón Principal',
      estado: m.estado,
    });
    this.mesaModalOpen.set(true);
  }

  onSubmitMesa(): void {
    const f = this.mesaForm();
    if (f.numeroMesa <= 0 || f.capacidad <= 0) {
      alert('Número de mesa y capacidad deben ser mayores a 0');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      numeroMesa: Number(f.numeroMesa),
      capacidad: Number(f.capacidad),
      ubicacion: f.ubicacion.trim() || undefined,
      estado: f.estado,
    };

    const action$ = this.editMesaId()
      ? this.mesaService.updateMesa(this.editMesaId()!, req)
      : this.mesaService.createMesa(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.mesaModalOpen.set(false);
        this.loadMesas();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar mesa');
      },
    });
  }

  deleteMesa(m: Mesa): void {
    if (!confirm(`¿Eliminar la Mesa #${m.numeroMesa}?`)) return;
    this.mesaService.deleteMesa(m.id).subscribe({
      next: () => this.loadMesas(),
      error: (e) => alert(e.error?.message || 'Error al eliminar mesa'),
    });
  }

  // --- USUARIOS / PERSONAL ---
  loadUsuarios(): void {
    this.usuarioService.getUsuarios(0, 100).subscribe({
      next: (res) => this.usuarios.set(res.content),
      error: () => {},
    });
  }

  openCrearUsuario(): void {
    this.editUsuarioUuid.set(null);
    this.usuarioForm.set({
      nombre: '',
      apellido: '',
      cedula: '',
      email: '',
      password: '',
      rol: 'MESERO',
      activo: true,
    });
    this.usuarioModalOpen.set(true);
  }

  openEditarUsuario(u: Usuario): void {
    this.editUsuarioUuid.set(u.uuid);
    this.usuarioForm.set({
      nombre: u.nombre,
      apellido: u.apellido,
      cedula: u.cedula,
      email: u.email,
      password: '',
      rol: u.rol,
      activo: u.activo,
    });
    this.usuarioModalOpen.set(true);
  }

  onSubmitUsuario(): void {
    const f = this.usuarioForm();
    if (!f.nombre.trim() || !f.apellido.trim() || !f.email.trim() || !f.cedula.trim()) {
      alert('Completa los campos obligatorios del usuario');
      return;
    }
    if (!this.editUsuarioUuid() && (!f.password || f.password.length < 4)) {
      alert('La contraseña temporal debe tener al menos 4 caracteres');
      return;
    }

    this.loadingSubmit.set(true);
    const req: any = {
      nombre: f.nombre.trim(),
      apellido: f.apellido.trim(),
      cedula: f.cedula.trim(),
      email: f.email.trim(),
      rol: f.rol,
      activo: f.activo,
    };
    if (f.password && f.password.trim()) {
      req.password = f.password.trim();
    }

    const action$ = this.editUsuarioUuid()
      ? this.usuarioService.updateUsuario(this.editUsuarioUuid()!, req)
      : this.usuarioService.createUsuario(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.usuarioModalOpen.set(false);
        this.loadUsuarios();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar personal');
      },
    });
  }

  toggleActivoUsuario(u: Usuario): void {
    const nuevoEstado = !u.activo;
    this.usuarioService.updateUsuario(u.uuid, { activo: nuevoEstado }).subscribe({
      next: () => (u.activo = nuevoEstado),
      error: (e) => alert(e.error?.message || 'Error al cambiar estado'),
    });
  }

  deleteUsuario(u: Usuario): void {
    if (!confirm(`¿Eliminar al empleado ${u.nombre} ${u.apellido}?`)) return;
    this.usuarioService.deleteUsuario(u.uuid).subscribe({
      next: () => this.loadUsuarios(),
      error: (e) => alert(e.error?.message || 'Error al eliminar usuario'),
    });
  }

  // --- INSUMOS / INVENTARIO ---
  loadInsumos(): void {
    this.insumoService.getInsumos(0, 100).subscribe({
      next: (res) => this.insumos.set(res.content),
      error: () => {},
    });
  }

  openCrearInsumo(): void {
    this.editInsumoId.set(null);
    this.insumoForm.set({
      nombre: '',
      unidadMedida: 'UNIDAD',
      stockActual: 10,
      stockMinimo: 5,
      costoPromedio: 1.0,
    });
    this.insumoModalOpen.set(true);
  }

  openEditarInsumo(i: Insumo): void {
    this.editInsumoId.set(i.id);
    this.insumoForm.set({
      nombre: i.nombre,
      unidadMedida: i.unidadMedida,
      stockActual: i.stockActual,
      stockMinimo: i.stockMinimo,
      costoPromedio: i.costoPromedio,
    });
    this.insumoModalOpen.set(true);
  }

  onSubmitInsumo(): void {
    const f = this.insumoForm();
    if (!f.nombre.trim() || f.stockActual < 0 || f.stockMinimo < 0) {
      alert('Ingresa un nombre y cantidades válidas');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      nombre: f.nombre.trim(),
      unidadMedida: f.unidadMedida,
      stockActual: Number(f.stockActual),
      stockMinimo: Number(f.stockMinimo),
      costoPromedio: Number(f.costoPromedio),
    };

    const action$ = this.editInsumoId()
      ? this.insumoService.updateInsumo(this.editInsumoId()!, req)
      : this.insumoService.createInsumo(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.insumoModalOpen.set(false);
        this.loadInsumos();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar insumo');
      },
    });
  }

  deleteInsumo(i: Insumo): void {
    if (!confirm(`¿Eliminar el insumo "${i.nombre}"?`)) return;
    this.insumoService.deleteInsumo(i.id).subscribe({
      next: () => this.loadInsumos(),
      error: (e) => alert(e.error?.message || 'Error al eliminar insumo'),
    });
  }

  // --- DISTRIBUIDORES ---
  loadDistribuidores(): void {
    this.distribuidorService.getDistribuidores(0, 100).subscribe({
      next: (res) => this.distribuidores.set(res.content),
      error: () => {},
    });
  }

  openCrearDistribuidor(): void {
    this.editDistribuidorId.set(null);
    this.distribuidorForm.set({
      ruc: '',
      razonSocial: '',
      nombreContacto: '',
      telefono: '',
      email: '',
      direccion: '',
      categoriaProveedor: 'Alimentos',
      esProveedorLocal: false,
    });
    this.distribuidorModalOpen.set(true);
  }

  openEditarDistribuidor(d: Distribuidor): void {
    this.editDistribuidorId.set(d.id);
    this.distribuidorForm.set({
      ruc: d.ruc,
      razonSocial: d.razonSocial,
      nombreContacto: d.nombreContacto || '',
      telefono: d.telefono || '',
      email: d.email || '',
      direccion: d.direccion || '',
      categoriaProveedor: d.categoriaProveedor || 'General',
      esProveedorLocal: d.esProveedorLocal ?? false,
    });
    this.distribuidorModalOpen.set(true);
  }

  onSubmitDistribuidor(): void {
    const f = this.distribuidorForm();
    if (!f.ruc.trim() || !f.razonSocial.trim()) {
      alert('RUC y Razón Social son obligatorios');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      ruc: f.ruc.trim(),
      razonSocial: f.razonSocial.trim(),
      nombreContacto: f.nombreContacto.trim() || undefined,
      telefono: f.telefono.trim() || undefined,
      email: f.email.trim() || undefined,
      direccion: f.direccion.trim() || undefined,
      categoriaProveedor: f.categoriaProveedor.trim() || undefined,
      esProveedorLocal: f.esProveedorLocal,
    };

    const action$ = this.editDistribuidorId()
      ? this.distribuidorService.updateDistribuidor(this.editDistribuidorId()!, req)
      : this.distribuidorService.createDistribuidor(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.distribuidorModalOpen.set(false);
        this.loadDistribuidores();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar distribuidor');
      },
    });
  }

  deleteDistribuidor(d: Distribuidor): void {
    if (!confirm(`¿Eliminar al proveedor "${d.razonSocial}"?`)) return;
    this.distribuidorService.deleteDistribuidor(d.id).subscribe({
      next: () => this.loadDistribuidores(),
      error: (e) => alert(e.error?.message || 'Error al eliminar distribuidor'),
    });
  }

  // --- CLIENTES ---
  loadClientes(): void {
    this.clienteService.getClientes(0, 100).subscribe({
      next: (res) => this.clientes.set(res.content),
      error: () => {},
    });
  }

  openCrearCliente(): void {
    this.editClienteUuid.set(null);
    this.clienteForm.set({
      tipoIdentificacion: 'CEDULA',
      identificacion: '',
      razonSocial: '',
      email: '',
      telefono: '',
      direccion: '',
    });
    this.clienteModalOpen.set(true);
  }

  openEditarCliente(c: Cliente): void {
    this.editClienteUuid.set(c.uuid);
    this.clienteForm.set({
      tipoIdentificacion: c.tipoIdentificacion,
      identificacion: c.identificacion,
      razonSocial: c.razonSocial,
      email: c.email || '',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
    });
    this.clienteModalOpen.set(true);
  }

  onSubmitCliente(): void {
    const f = this.clienteForm();
    if (!f.identificacion.trim() || !f.razonSocial.trim()) {
      alert('Identificación y Razón Social son obligatorias');
      return;
    }

    this.loadingSubmit.set(true);
    const req = {
      tipoIdentificacion: f.tipoIdentificacion,
      identificacion: f.identificacion.trim(),
      razonSocial: f.razonSocial.trim(),
      email: f.email.trim() || undefined,
      telefono: f.telefono.trim() || undefined,
      direccion: f.direccion.trim() || undefined,
    };

    const action$ = this.editClienteUuid()
      ? this.clienteService.updateCliente(this.editClienteUuid()!, req)
      : this.clienteService.createCliente(req);

    action$.subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.clienteModalOpen.set(false);
        this.loadClientes();
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert(err.error?.message || 'Error al guardar cliente');
      },
    });
  }

  deleteCliente(c: Cliente): void {
    if (!confirm(`¿Eliminar al cliente "${c.razonSocial}"?`)) return;
    this.clienteService.deleteCliente(c.uuid).subscribe({
      next: () => this.loadClientes(),
      error: (e) => alert(e.error?.message || 'Error al eliminar cliente'),
    });
  }

  // --- TURNOS (ODS 8: Trabajo Decente) ---
  loadTurnos(): void {
    this.turnoService.getAll(0, 100).subscribe({
      next: (res) => this.turnos.set(res.content),
      error: () => {},
    });
  }

  iniciarTurnoEmpleado(u: Usuario): void {
    if (!confirm(`¿Iniciar turno laboral para ${u.nombre} ${u.apellido}?`)) return;
    this.turnoService.iniciarTurno({ idUsuario: u.uuid, observaciones: 'Fichaje desde panel administrativo' }).subscribe({
      next: () => {
        alert(`Turno iniciado para ${u.nombre} ${u.apellido}`);
        this.loadTurnos();
      },
      error: (e) => alert(e.error?.message || 'Error al iniciar turno'),
    });
  }

  cerrarTurnoEmpleado(u: Usuario): void {
    if (!confirm(`¿Finalizar turno de ${u.nombre} ${u.apellido}?`)) return;
    this.turnoService.cerrarTurno({ idUsuario: u.uuid, observaciones: 'Cierre registrado por administración' }).subscribe({
      next: (t) => {
        alert(`Turno cerrado para ${u.nombre}. Total registrado: ${t.totalHoras || 0} horas`);
        this.loadTurnos();
      },
      error: (e) => alert(e.error?.message || 'Error al cerrar turno'),
    });
  }
}
