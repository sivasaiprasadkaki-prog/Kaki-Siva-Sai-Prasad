import { Component, ChangeDetectionStrategy, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Expense, ExpenseType, Attachment } from '../../models';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseFormComponent implements OnInit {
  mode = input.required<ExpenseType>();
  expense = input<Expense | null>(null);
  
  close = output<void>();
  save = output<Omit<Expense, 'id'>>();
  
  fb = new FormBuilder();
  expenseForm = this.fb.group({
    date: ['', Validators.required],
    details: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    category: ['Food', Validators.required],
    customCategory: [''],
    mode: ['Cash', Validators.required],
  });

  attachedFiles = signal<Attachment[]>([]);
  isCustomCategory = signal(false);
  errorMessage = signal<string | null>(null);

  get isEditMode(): boolean {
    return !!this.expense();
  }

  ngOnInit() {
    this.expenseForm.get('category')?.valueChanges.subscribe(value => {
      this.isCustomCategory.set(value === 'Custom');
      const customCategoryControl = this.expenseForm.get('customCategory');
      if (value === 'Custom') {
        customCategoryControl?.setValidators(Validators.required);
      } else {
        customCategoryControl?.clearValidators();
      }
      customCategoryControl?.updateValueAndValidity();
    });

    const expenseData = this.expense();
    if (expenseData) {
      const category = ['Food', 'Rent', 'Utilities', 'Transport', 'Health Care'].includes(expenseData.category) ? expenseData.category : 'Custom';
      
      this.expenseForm.patchValue({
        date: new Date(expenseData.date).toISOString().substring(0, 16),
        details: expenseData.details,
        amount: expenseData.amount,
        category: category,
        customCategory: category === 'Custom' ? expenseData.category : '',
        mode: expenseData.mode,
      });
      this.attachedFiles.set(expenseData.attachments);
    } else {
        this.expenseForm.patchValue({
            date: new Date().toISOString().substring(0, 16)
        });
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    
    const files = Array.from(input.files);
    if (this.attachedFiles().length + files.length > 5) {
        this.errorMessage.set('You can upload a maximum of 5 files.');
        return;
    }
    
    this.errorMessage.set(null);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.attachedFiles.update(current => [...current, {
          name: file.name,
          type: file.type,
          dataUrl: e.target.result,
        }]);
      };
      reader.readAsDataURL(file);
    });
  }

  removeAttachment(attachmentToRemove: Attachment) {
    this.attachedFiles.update(files => files.filter((file) => file !== attachmentToRemove));
  }

  onSubmit() {
    this.errorMessage.set(null);
    if (this.expenseForm.invalid) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }
    
    if (this.attachedFiles().length > 5) {
      this.errorMessage.set('Please upload up to 5 files.');
      return;
    }

    const formValue = this.expenseForm.value;
    const finalCategory = this.isCustomCategory() ? formValue.customCategory : formValue.category;

    const expenseData: Omit<Expense, 'id'> = {
      type: this.mode(),
      date: new Date(formValue.date!).toISOString(),
      details: formValue.details!,
      amount: formValue.amount!,
      category: finalCategory!,
      mode: formValue.mode!,
      attachments: this.attachedFiles(),
    };
    
    this.save.emit(expenseData);
  }
}