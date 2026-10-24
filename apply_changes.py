import re
import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ----------------------------------------------------------------------
# 1. Dashboard Date Filter
# ----------------------------------------------------------------------
# Check if date input already present in dash card
if 'id="dashOrderDate"' not in content:
    old_kpi = re.search(r'<div class="bento glass card p-4 sm:p-5">\s*<div class="flex items-start justify-between">\s*<div class="text-\[11px\] font-bold uppercase tracking-widest text-slate-400">Today\'s Orders</div>[\s\S]*?id="kpiTodaySub">.*?</div>\s*</div>', content)
    if old_kpi:
        replacement_kpi = '''<div class="bento glass card p-4 sm:p-5">
            <div class="flex items-start justify-between">
              <div class="text-[11px] font-bold uppercase tracking-widest text-slate-400" id="dashOrdersLabel">Today's Orders</div>
              <span class="pill bg-[rgb(var(--acc-rgb)/.12)] text-[rgb(var(--acc-rgb))]"><i class="fa-solid fa-arrow-trend-up text-[9px]"></i> live</span>
            </div>
            <div class="mt-3 text-3xl sm:text-4xl font-extrabold mono tracking-tight" id="kpiToday">0</div>
            <div class="text-[11px] text-slate-400 mt-1" id="kpiTodaySub">0 pending · 0 in process</div>
            <div class="mt-3 pt-2 border-t hairline flex items-center gap-1.5">
              <i class="fa-regular fa-calendar text-[11px] text-slate-400"></i>
              <input type="date" id="dashOrderDate" class="field !py-0.5 !px-1.5 !text-xs !w-auto flex-1 font-mono" onchange="Dashboard.setDateFilter(this.value)" title="Filter orders by date">
              <button class="btn btn-ghost btn-xs text-[10px] px-1.5" onclick="Dashboard.resetDateFilter()" title="Reset to today"><i class="fa-solid fa-rotate-left"></i></button>
            </div>
          </div>'''
        content = content[:old_kpi.start()] + replacement_kpi + content[old_kpi.end():]
        print('Applied Dashboard Today Orders HTML')

# ----------------------------------------------------------------------
# 2. Swap Customer Card and Line Items Card in view-order
# so Line Items is ABOVE Customer Card
# ----------------------------------------------------------------------
view_order_m = re.search(r'<section id="view-order" class="view hidden">[\s\S]*?<div class="grid xl:grid-cols-\[minmax\(0,1fr\)_380px\] gap-4">\s*<div class="space-y-4">([\s\S]*?)</div>\s*<!-- summary -->', content)
if view_order_m:
    inner = view_order_m.group(1)
    # Split into customer card and line items card
    cust_card_m = re.search(r'(<!-- customer -->\s*<div class="glass card p-4 sm:p-5">[\s\S]*?</div>\s*</div>\s*</div>)', inner)
    line_card_m = re.search(r'(<!-- line items -->\s*<div class="glass card p-4 sm:p-5">[\s\S]*?</div>\s*</div>\s*</div>\s*</div>)', inner)
    if cust_card_m and line_card_m:
        cust_card_str = cust_card_m.group(1)
        line_card_str = line_card_m.group(1)
        # Wrap with explicit relative z-indices
        line_card_str = line_card_str.replace('class="glass card p-4 sm:p-5"', 'class="glass card p-4 sm:p-5 relative z-20"')
        cust_card_str = cust_card_str.replace('class="glass card p-4 sm:p-5"', 'class="glass card p-4 sm:p-5 relative z-10"')
        
        # Now place line items card FIRST, customer card SECOND
        new_inner = f"\n            {line_card_str}\n            {cust_card_str}\n          "
        content = content[:view_order_m.start(1)] + new_inner + content[view_order_m.end(1):]
        print('Applied reordering: Line items card is now placed above Select Customer card')

# ----------------------------------------------------------------------
# 3. Replace catChips with Category Dropdown (select) in Line Items Card
# ----------------------------------------------------------------------
old_chips_html = '<div class="flex gap-2 overflow-auto hide-scroll pb-1 mb-3" id="catChips"></div>'
new_cat_select_html = '''<div class="mb-3 flex items-center gap-2">
                <label class="lbl !mb-0 font-bold text-xs whitespace-nowrap text-slate-400 uppercase tracking-wider">
                  <i class="fa-solid fa-layer-group text-[rgb(var(--acc-rgb))] mr-1"></i> Category
                </label>
                <select id="catSelect" class="field flex-1 text-sm font-semibold" onchange="OrderUI.lock(this.value || null)">
                  <option value="">All Categories</option>
                </select>
                <button class="btn btn-ghost btn-sm" onclick="OrderUI.unlock()" title="Reset Category"><i class="fa-solid fa-rotate-left"></i></button>
              </div>'''
if old_chips_html in content:
    content = content.replace(old_chips_html, new_cat_select_html)
    print('Replaced catChips buttons with catSelect dropdown')

# ----------------------------------------------------------------------
# 4. Add PDF button on Order History page
# ----------------------------------------------------------------------
old_orders_bar = '<button class="btn btn-soft btn-sm" onclick="Export.ordersXlsx()"><i class="fa-solid fa-file-excel"></i> Excel</button>'
new_orders_bar = '''<button class="btn btn-soft btn-sm" onclick="Export.ordersXlsx()"><i class="fa-solid fa-file-excel text-emerald-500"></i> Excel</button>
            <button class="btn btn-soft btn-sm" onclick="Export.ordersPdf()"><i class="fa-solid fa-file-pdf text-rose-500"></i> PDF</button>'''
if old_orders_bar in content:
    content = content.replace(old_orders_bar, new_orders_bar)
    print('Added PDF button to Order History toolbar')

# ----------------------------------------------------------------------
# 5. Add Demand Area & Customer filters and Order button in Demand view
# ----------------------------------------------------------------------
old_demand_bar = '<select id="demandCat" class="field !w-auto" onchange="Demand.render()"><option value="">All categories</option></select>'
new_demand_bar = '''<select id="demandCat" class="field !w-auto" onchange="Demand.render()"><option value="">All categories</option></select>
            <select id="demandArea" class="field !w-auto" onchange="Demand.render()"><option value="">All locations/areas</option></select>
            <div class="relative min-w-[150px]">
              <i class="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input id="demandCust" class="field !pl-8 !w-auto text-xs" placeholder="Filter customer / shop…" oninput="Demand.render()">
            </div>
            <button class="btn btn-accent btn-sm" onclick="Demand.orderFiltered()" title="Order filtered demand items">
              <i class="fa-solid fa-cart-plus mr-1"></i> Order
            </button>'''
if old_demand_bar in content:
    content = content.replace(old_demand_bar, new_demand_bar)
    print('Added location, customer filters and Order button to Demand toolbar')

# ----------------------------------------------------------------------
# 6. Add Template button in Product Catalog toolbar
# ----------------------------------------------------------------------
old_prod_bar = '<button class="btn btn-soft btn-sm" onclick="Export.productsXlsx()"><i class="fa-solid fa-file-excel"></i> Excel</button>'
new_prod_bar = '''<button class="btn btn-soft btn-sm" onclick="Export.productsXlsx()"><i class="fa-solid fa-file-excel text-emerald-500"></i> Excel</button>
            <button class="btn btn-ghost btn-sm" onclick="Export.productTemplate()" title="Download Excel template for products"><i class="fa-solid fa-download"></i> Template</button>'''
if old_prod_bar in content:
    content = content.replace(old_prod_bar, new_prod_bar)
    print('Added Template button to Product Catalog toolbar')

# Save HTML updates
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('HTML modifications complete.')
