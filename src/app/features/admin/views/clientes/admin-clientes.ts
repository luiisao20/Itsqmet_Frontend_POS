import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../../service/cliente-service';
import { PedidoService } from '../../../../service/pedido-service';
import { FacturaService } from '../../../../service/factura-service';
import { Cliente } from '../../../../models/cliente';
import { TipoIdentificacion } from '../../../../models/auth';
import { Pedido } from '../../../../models/pedido';
import { Factura } from '../../../../models/factura';
import { Badge } from '../../../../shared/badge/badge';
import { Button } from '../../../../shared/button/button';
import { Modal } from '../../../../shared/modal/modal';

@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Button, Modal],
  templateUrl: './admin-clientes.html',
})
export class AdminClientes implements OnInit {
  private clienteService = inject(ClienteService);
  private pedidoService = inject(PedidoService);
  private facturaService = inject(FacturaService);

  clientes = signal<Cliente[]>([]);
  loading = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);

  // Modal Crear / Editar Cliente
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

  // Modal Historial y Detalle del Cliente
  clienteDetalleModalOpen = signal<boolean>(false);
  clienteSeleccionado = signal<Cliente | null>(null);
  pedidosCliente = signal<Pedido[]>([]);
  facturasCliente = signal<Factura[]>([]);
  loadingClienteDetalle = signal<boolean>(false);
  tabClienteDetalle = signal<'pedidos' | 'facturas'>('pedidos');
  pedidoDetalleExpandido = signal<number | null>(null);

  // Modal Factura seleccionada desde el historial
  facturaDetalleModalOpen = signal<boolean>(false);
  selectedFactura = signal<Factura | null>(null);

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);
    this.clienteService.getClientes(0, 100).subscribe({
      next: (res) => {
        this.clientes.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
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

  // --- DETALLE INDIVIDUAL DE CLIENTE ---
  openDetalleCliente(c: Cliente): void {
    this.clienteSeleccionado.set(c);
    this.tabClienteDetalle.set('pedidos');
    this.pedidoDetalleExpandido.set(null);
    this.clienteDetalleModalOpen.set(true);
    this.loadHistorialCliente(c);
  }

  loadHistorialCliente(c: Cliente): void {
    this.loadingClienteDetalle.set(true);
    this.pedidosCliente.set([]);
    this.facturasCliente.set([]);

    this.pedidoService.searchPedidos(undefined, undefined, undefined, c.uuid).subscribe({
      next: (res) => this.pedidosCliente.set(res.content),
      error: () => this.pedidosCliente.set([]),
    });

    this.facturaService.searchFacturas(undefined, c.identificacion, undefined, 0, 50).subscribe({
      next: (res) => {
        this.facturasCliente.set(res.content);
        this.loadingClienteDetalle.set(false);
      },
      error: () => {
        this.facturasCliente.set([]);
        this.loadingClienteDetalle.set(false);
      },
    });
  }

  setTabClienteDetalle(tab: 'pedidos' | 'facturas'): void {
    this.tabClienteDetalle.set(tab);
  }

  toggleExpandirPedido(id: number): void {
    this.pedidoDetalleExpandido.update((curr) => (curr === id ? null : id));
  }

  getPedidoTotal(p: Pedido): number {
    return p.detalles?.reduce((sum, d) => sum + (d.subtotal || 0), 0) || 0;
  }

  getTotalFacturadoCliente(): number {
    return this.facturasCliente()
      .filter((f) => f.estado === 'EMITIDA')
      .reduce((sum, f) => sum + (f.total || 0), 0);
  }

  openVerDetalleFactura(f: Factura): void {
    this.selectedFactura.set(f);
    this.facturaDetalleModalOpen.set(true);
  }
}
