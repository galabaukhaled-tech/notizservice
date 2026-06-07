"use client"

import { useState, useMemo } from "react"
import { Plus, MoreHorizontal, Pencil, Trash2, ClipboardList } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useStore } from "@/lib/store"
import type { Employee } from "@/lib/types"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

const colorOptions = [
  "#5B7FFF", // Blue
  "#34D399", // Green
  "#F59E0B", // Orange
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EF4444", // Red
  "#84CC16", // Lime
]

interface EmployeeFormProps {
  employee?: Employee
  onSuccess?: () => void
}

function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
  const [name, setName] = useState(employee?.name || "")
  const [color, setColor] = useState(employee?.color || colorOptions[0])
  const [isLoading, setIsLoading] = useState(false)
  
  const addEmployee = useStore((state) => state.addEmployee)
  const updateEmployee = useStore((state) => state.updateEmployee)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Bitte Namen eingeben")
      return
    }

    setIsLoading(true)

    try {
      if (employee) {
        await updateEmployee(employee.id, { name, color })
        toast.success("Mitarbeiter aktualisiert")
      } else {
        await addEmployee({ name, color })
        toast.success("Mitarbeiter erstellt")
      }
      onSuccess?.()
    } catch {
      toast.error("Fehler beim Speichern")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mitarbeitername"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Farbe</Label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`size-8 rounded-full transition-all ${
                color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <div
          className="size-10 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <div>
          <p className="font-medium">{name || "Vorschau"}</p>
          <p className="text-sm text-muted-foreground">Mitarbeiter</p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Spinner className="mr-2" />}
        {employee ? "Speichern" : "Mitarbeiter erstellen"}
      </Button>
    </form>
  )
}

export default function MitarbeiterPage() {
  const employees = useStore((state) => state.employees)
  const orders = useStore((state) => state.orders)
  const deleteEmployee = useStore((state) => state.deleteEmployee)
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const getOrderStats = (employeeId: string) => {
    const employeeOrders = orders.filter((o) => o.employeeId === employeeId)
    return {
      total: employeeOrders.length,
      open: employeeOrders.filter((o) => o.status === "offen").length,
      inProgress: employeeOrders.filter((o) => o.status === "in-bearbeitung").length,
      done: employeeOrders.filter((o) => o.status === "erledigt").length,
    }
  }

  const handleDelete = () => {
    if (deletingEmployee) {
      deleteEmployee(deletingEmployee.id)
      toast.success("Mitarbeiter gelöscht")
      setDeletingEmployee(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mitarbeiter</h1>
          <p className="text-muted-foreground">
            {employees.length} Mitarbeiter insgesamt
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-1" />
              Neuer Mitarbeiter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuer Mitarbeiter</DialogTitle>
              <DialogDescription>
                Fügen Sie einen neuen Mitarbeiter hinzu.
              </DialogDescription>
            </DialogHeader>
            <EmployeeForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Employee List */}
      {employees.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Noch keine Mitarbeiter vorhanden
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => {
            const stats = getOrderStats(employee.id)
            
            return (
              <Card key={employee.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-full shrink-0"
                        style={{ backgroundColor: employee.color }}
                      />
                      <CardTitle className="text-base font-semibold">
                        {employee.name}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingEmployee(employee)}>
                          <Pencil className="size-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingEmployee(employee)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <ClipboardList className="size-4" />
                    <span>{stats.total} Aufträge zugewiesen</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-status-open border-status-open/30">
                      {stats.open} Offen
                    </Badge>
                    <Badge variant="outline" className="text-status-progress border-status-progress/30">
                      {stats.inProgress} Aktiv
                    </Badge>
                    <Badge variant="outline" className="text-status-done border-status-done/30">
                      {stats.done} Erledigt
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Mitarbeiterdaten.
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <EmployeeForm
              employee={editingEmployee}
              onSuccess={() => setEditingEmployee(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEmployee} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitarbeiter löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Mitarbeiter &quot;{deletingEmployee?.name}&quot; wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
