<script setup>
import { computed, onMounted, ref } from 'vue'
import { useEmployeesStore, useDepartmentStore } from '@/stores'
import { ElMessage } from 'element-plus'

const employeesStore = useEmployeesStore()
const departmentStore = useDepartmentStore()

const employees = computed(() => employeesStore.employees || [])
const departments = computed(() => departmentStore.departments || [])
const loading = computed(() => employeesStore.loading || departmentStore.loading)

const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const monthFilter = ref(null)
const queriedMonth = ref(null)
const hasSearched = ref(false)
const primaryDeptId = ref('')
const secondaryDeptName = ref('')
const positionFilter = ref('')
const nameFilter = ref('')
const batchDay = ref('')
const batchShiftKey = ref('morning')
const selectedRows = ref([])
const scheduleState = ref({})

const SHIFT_DICT = {
  morning: { short: '早', label: '早班', className: 'morning' },
  middle: { short: '中', label: '中班', className: 'middle' },
  night: { short: '晚', label: '晚班', className: 'night' },
  rest: { short: '休', label: '休息', className: 'rest' },
  annual: { short: '假', label: '年假', className: 'annual' }
}

const shiftOrder = ['morning', 'middle', 'night', 'rest', 'annual']
const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六']

const departmentOptions = computed(() => {
  return departments.value
    .map((dept) => ({
      id: dept.DeptID ?? dept.departmentID ?? dept.departmentId ?? dept.id,
      name: dept.DeptName ?? dept.departmentName ?? dept.name,
      parentId: dept.SuperiorDept ?? dept.parentId ?? dept.parentID ?? dept.parent,
      shiftType: dept.ShiftType ?? 0
    }))
    .filter(option => option.name)
})

const primaryDepartments = computed(() => {
  return departmentOptions.value.filter(d => d.parentId === -1 || d.parentId === null || d.parentId === undefined)
})

const secondaryDepartments = computed(() => {
  if (!primaryDeptId.value) {
    return []
  }
  return departmentOptions.value.filter(d => d.parentId === primaryDeptId.value)
})

const selectedPrimaryDeptName = computed(() => {
  if (!primaryDeptId.value) {
    return ''
  }
  const primary = departmentOptions.value.find(d => d.id === primaryDeptId.value)
  return primary?.name || ''
})

const positionOptions = computed(() => {
  const options = new Set(
    employees.value
      .map(emp => emp.staffPos)
      .filter(Boolean)
  )
  return [...options]
})

const shiftOptions = computed(() => {
  return Object.entries(SHIFT_DICT).map(([value, item]) => ({
    value,
    label: item.label
  }))
})

const getMonthString = (monthDate) => {
  const target = monthDate instanceof Date ? monthDate : new Date()
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`
}

const selectedMonthText = computed(() => {
  if (!queriedMonth.value) {
    return ''
  }
  return getMonthString(queriedMonth.value)
})

const getDepartmentDisplay = (deptName) => {
  if (!deptName) {
    return ''
  }

  if (deptName.includes('-')) {
    return deptName
  }

  const currentDept = departmentOptions.value.find(d => d.name === deptName)
  if (!currentDept) {
    return deptName
  }

  const parentDept = departmentOptions.value.find(d => d.id === currentDept.parentId)
  return parentDept ? `${parentDept.name}-${currentDept.name}` : currentDept.name
}

const getPositionDisplay = (emp) => {
  if (!emp) {
    return ''
  }

  const deptText = getDepartmentDisplay(emp.staffDept)
  const positionText = emp.staffPos || ''

  if (!deptText) {
    return positionText
  }

  if (!positionText) {
    return deptText
  }

  return `${deptText}-${positionText}`
}

const parseDepartment = (deptName) => {
  const formatted = getDepartmentDisplay(deptName)
  if (!formatted) {
    return { primary: '', secondary: '' }
  }

  const parts = formatted.split('-')
  return {
    primary: parts[0] || '',
    secondary: parts[1] || ''
  }
}

const getSeed = (text) => {
  return String(text || '')
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
}

const monthDayColumns = computed(() => {
  if (!queriedMonth.value) {
    return []
  }

  const year = queriedMonth.value.getFullYear()
  const month = queriedMonth.value.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const date = new Date(year, month, day)
    return {
      day,
      key: `${year}-${month + 1}-${day}`,
      weekday: weekDayLabels[date.getDay()]
    }
  })
})

const batchDayOptions = computed(() => {
  return monthDayColumns.value.map(item => ({
    value: item.day,
    label: `${item.day}日 (${item.weekday})`
  }))
})

const getShiftSequence = (emp) => {
  const dept = departmentOptions.value.find(item => item.name === emp.staffDept)
  const shiftType = dept?.shiftType ?? 0

  if (shiftType === 1) {
    return ['night', 'night', 'rest']
  }

  if (shiftType === 2) {
    return ['morning', 'middle', 'morning', 'rest']
  }

  return ['morning', 'morning', 'middle', 'rest']
}

const buildDefaultScheduleMap = (emp, monthText) => {
  const seed = getSeed(`${emp.staffID}-${monthText}`)
  const sequence = getShiftSequence(emp)
  const map = {}

  monthDayColumns.value.forEach(({ day, weekday }) => {
    let shiftKey = sequence[(seed + day) % sequence.length]

    if (weekday === '日' && (seed + day) % 4 !== 0) {
      shiftKey = 'rest'
    }

    if ((seed + day) % 13 === 0) {
      shiftKey = 'annual'
    }

    map[day] = shiftKey
  })

  return map
}

const ensureMonthSchedule = () => {
  const monthText = selectedMonthText.value
  if (!monthText) {
    return
  }

  if (!scheduleState.value[monthText]) {
    scheduleState.value[monthText] = {}
  }

  employees.value.forEach((emp) => {
    if (!scheduleState.value[monthText][emp.staffID]) {
      scheduleState.value[monthText][emp.staffID] = buildDefaultScheduleMap(emp, monthText)
    }
  })
}

const calculateSummary = (scheduleMap = {}) => {
  let workDays = 0
  let restDays = 0
  let annualLeaveDays = 0

  Object.values(scheduleMap).forEach((shiftKey) => {
    if (shiftKey === 'rest') {
      restDays += 1
    } else if (shiftKey === 'annual') {
      annualLeaveDays += 1
    } else {
      workDays += 1
    }
  })

  return { workDays, restDays, annualLeaveDays }
}

const scheduleRows = computed(() => {
  if (!hasSearched.value || !queriedMonth.value) {
    return []
  }

  ensureMonthSchedule()
  const monthText = selectedMonthText.value

  return employees.value.map((emp) => {
    const scheduleMap = scheduleState.value[monthText]?.[emp.staffID] || {}
    return {
      ...emp,
      accountingMonth: monthText,
      scheduleMap,
      ...calculateSummary(scheduleMap)
    }
  })
})

const filteredScheduleRows = computed(() => {
  return scheduleRows.value.filter((row) => {
    const { primary, secondary } = parseDepartment(row.staffDept)

    if (selectedPrimaryDeptName.value && primary !== selectedPrimaryDeptName.value) {
      return false
    }

    if (secondaryDeptName.value && secondary !== secondaryDeptName.value) {
      return false
    }

    if (positionFilter.value && row.staffPos !== positionFilter.value) {
      return false
    }

    if (nameFilter.value && !String(row.staffName || '').includes(nameFilter.value.trim())) {
      return false
    }

    return true
  })
})

const paginatedScheduleRows = computed(() => {
  pagination.value.total = filteredScheduleRows.value.length
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filteredScheduleRows.value.slice(start, end)
})

const legendItems = computed(() => Object.values(SHIFT_DICT))

const handlePrimaryDeptChange = () => {
  secondaryDeptName.value = ''
  pagination.value.currentPage = 1
}

const handleSecondaryDeptChange = () => {
  pagination.value.currentPage = 1
}

const handleFilterChange = () => {
  pagination.value.currentPage = 1
}

const handleQuery = () => {
  if (!(monthFilter.value instanceof Date)) {
    ElMessage.warning('请先选择排班月份')
    return
  }

  queriedMonth.value = new Date(monthFilter.value.getFullYear(), monthFilter.value.getMonth(), 1)
  hasSearched.value = true
  batchDay.value = ''
  selectedRows.value = []
  pagination.value.currentPage = 1
  ensureMonthSchedule()
}

const handleCurrentChange = (val) => {
  pagination.value.currentPage = val
}

const handleSizeChange = (val) => {
  pagination.value.pageSize = val
  pagination.value.currentPage = 1
}

const resetFilters = () => {
  monthFilter.value = null
  queriedMonth.value = null
  hasSearched.value = false
  primaryDeptId.value = ''
  secondaryDeptName.value = ''
  positionFilter.value = ''
  nameFilter.value = ''
  batchDay.value = ''
  selectedRows.value = []
  pagination.value.currentPage = 1
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const getCellShiftKey = (row, day) => {
  const monthText = selectedMonthText.value
  return scheduleState.value[monthText]?.[row.staffID]?.[day] || 'rest'
}

const getCellShift = (row, day) => {
  return SHIFT_DICT[getCellShiftKey(row, day)] || SHIFT_DICT.rest
}

const updateRowSchedule = (row, day, shiftKey) => {
  const monthText = selectedMonthText.value
  if (!scheduleState.value[monthText]) {
    scheduleState.value[monthText] = {}
  }

  if (!scheduleState.value[monthText][row.staffID]) {
    scheduleState.value[monthText][row.staffID] = buildDefaultScheduleMap(row, monthText)
  }

  scheduleState.value[monthText][row.staffID][day] = shiftKey
}

const cycleShift = (row, day) => {
  const currentKey = getCellShiftKey(row, day)
  const currentIndex = shiftOrder.indexOf(currentKey)
  const nextKey = shiftOrder[(currentIndex + 1) % shiftOrder.length]
  updateRowSchedule(row, day, nextKey)
}

const handleBatchApply = () => {
  if (!hasSearched.value) {
    ElMessage.warning('请先选择月份并点击查询')
    return
  }

  if (!batchDay.value) {
    ElMessage.warning('请选择要操作的日期')
    return
  }

  if (!selectedRows.value.length) {
    ElMessage.warning('请先勾选要排班的员工')
    return
  }

  selectedRows.value.forEach((row) => {
    updateRowSchedule(row, batchDay.value, batchShiftKey.value)
  })

  ElMessage.success('批量排班已应用')
}

const handleAutoSchedule = () => {
  if (!hasSearched.value) {
    ElMessage.warning('请先选择月份并点击查询')
    return
  }

  const monthText = selectedMonthText.value
  scheduleState.value[monthText] = {}
  employees.value.forEach((emp) => {
    scheduleState.value[monthText][emp.staffID] = buildDefaultScheduleMap(emp, monthText)
  })

  ElMessage.success('已重新生成默认排班')
}

const handleSaveSchedule = () => {
  if (!hasSearched.value) {
    ElMessage.warning('请先查询后再保存')
    return
  }

  ElMessage.success(`已保存 ${selectedMonthText.value} 月排班`) 
}

const loadData = () => {
  employeesStore.loadEmployees()
  departmentStore.loadDepartments()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="template-container">
    <div class="template-header">
      <div class="page-title">排班操作</div>
    </div>

    <div class="search-form-container">
      <div class="filters-row">
        <div class="filter-col filter-col-month">
          <el-date-picker
            v-model="monthFilter"
            type="month"
            format="YYYY-MM"
            placeholder="选择月份"
            class="filter-select"
          />
        </div>
        <div class="filter-col">
          <el-select v-model="primaryDeptId" placeholder="一级部门" class="filter-select" @change="handlePrimaryDeptChange">
            <el-option label="全部部门" value="" />
            <el-option v-for="dept in primaryDepartments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
        </div>
        <div class="filter-col">
          <el-select
            v-model="secondaryDeptName"
            placeholder="二级部门"
            class="filter-select"
            :disabled="!primaryDeptId"
            @change="handleSecondaryDeptChange"
          >
            <el-option label="全部二级部门" value="" />
            <el-option v-for="dept in secondaryDepartments" :key="dept.id" :label="dept.name" :value="dept.name" />
          </el-select>
        </div>
        <div class="filter-col">
          <el-select v-model="positionFilter" placeholder="职级" class="filter-select" clearable @change="handleFilterChange">
            <el-option v-for="pos in positionOptions" :key="pos" :label="pos" :value="pos" />
          </el-select>
        </div>
        <div class="filter-col">
          <el-input v-model="nameFilter" placeholder="按姓名筛选" clearable @input="handleFilterChange" />
        </div>
      </div>

      <div class="query-actions-row">
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="resetFilters">重置筛选</el-button>
        <el-button type="primary" plain @click="handleAutoSchedule">自动排班</el-button>
        <el-button type="success" @click="handleSaveSchedule">保存排班</el-button>
      </div>

      <div class="batch-actions-row">
        <div class="batch-title">批量操作</div>
        <div class="filter-col batch-day-col">
          <el-select v-model="batchDay" placeholder="选择日期" class="filter-select" :disabled="!hasSearched">
            <el-option v-for="item in batchDayOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="filter-col batch-shift-col">
          <el-select v-model="batchShiftKey" placeholder="选择班次" class="filter-select" :disabled="!hasSearched">
            <el-option v-for="item in shiftOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <el-button type="primary" :disabled="!hasSearched" @click="handleBatchApply">应用到已选员工</el-button>
      </div>
    </div>

    <div class="subtitle">{{ hasSearched ? `当前操作 ${selectedMonthText} 月份排班，点击单元格可切换班次` : '请选择月份并点击查询' }}</div>

    <div class="legend-row">
      <div v-for="item in legendItems" :key="item.className" class="legend-item">
        <span :class="['legend-dot', `dot-${item.className}`]">{{ item.short }}</span>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <el-table
      :data="paginatedScheduleRows"
      class="schedule-table"
      style="width: 100%"
      v-loading="loading"
      empty-text="请选择月份并点击查询"
      border
      stripe
      highlight-current-row
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="40" align="center" fixed="left" />
      <el-table-column prop="staffID" label="工号" min-width="85" align="center" fixed="left" />
      <el-table-column prop="staffName" label="姓名" min-width="90" align="center" fixed="left" />
      <el-table-column label="岗位" min-width="190" align="center" fixed="left" show-overflow-tooltip>
        <template #default="scope">
          {{ getPositionDisplay(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column prop="accountingMonth" label="月份" min-width="90" align="center" fixed="left" />
      <el-table-column prop="workDays" label="出勤" min-width="70" align="center" />
      <el-table-column prop="restDays" label="休息" min-width="70" align="center" />
      <el-table-column prop="annualLeaveDays" label="年假" min-width="70" align="center" />
      <el-table-column
        v-for="day in monthDayColumns"
        :key="day.key"
        :label="String(day.day)"
        min-width="70"
        align="center"
      >
        <template #header>
          <div class="day-header">
            <div>{{ day.day }}</div>
            <div class="weekday-text">{{ day.weekday }}</div>
          </div>
        </template>
        <template #default="scope">
          <div
            :class="['shift-cell', `shift-${getCellShift(scope.row, day.day).className}`]"
            @click="cycleShift(scope.row, day.day)"
          >
            {{ getCellShift(scope.row, day.day).short }}
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-family: 'YuanTi', sans-serif;
  font-size: 28px;
}

.template-container {
  padding: 30px;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.search-form-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
  margin-bottom: 20px;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.query-actions-row,
.batch-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.batch-title {
  font-weight: 600;
  color: #4a5568;
  margin-right: 6px;
}

.filter-col {
  width: 124px;
}

.filter-col-month {
  width: 136px;
}

.batch-day-col,
.batch-shift-col {
  width: 148px;
}

.filter-col-month :deep(.el-date-editor.el-input),
.filter-col-month :deep(.el-date-editor.el-input__wrapper) {
  width: 100% !important;
  min-width: 0;
}

.filter-select {
  width: 100%;
}

.subtitle {
  margin-bottom: 10px;
  color: #666;
}

.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 12px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4a5568;
  font-size: 13px;
}

.legend-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  color: #fff;
  font-weight: 700;
}

.dot-morning,
.shift-morning {
  background: #4f8cff;
}

.dot-middle,
.shift-middle {
  background: #20b26b;
}

.dot-night,
.shift-night {
  background: #6b5bda;
}

.dot-rest,
.shift-rest {
  background: #a0aec0;
}

.dot-annual,
.shift-annual {
  background: #f59e0b;
}

.schedule-table {
  --schedule-header-bg: #f5f8ff;
  --schedule-grid-color: #c2ccda;
  --el-table-border-color: var(--schedule-grid-color);
  --el-table-border: 1px solid var(--schedule-grid-color);
}

.schedule-table :deep(.el-table__header-wrapper thead th) {
  background: var(--schedule-header-bg);
  color: #000;
  font-weight: 700;
}

.schedule-table :deep(.el-table__cell) {
  border-right: 1px solid var(--schedule-grid-color);
}

.schedule-table :deep(.el-table tr td) {
  border-bottom: 1px solid var(--schedule-grid-color);
}

.day-header {
  line-height: 1.15;
}

.weekday-text {
  color: #7a8699;
  font-size: 12px;
  margin-top: 2px;
}

.shift-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  border-radius: 8px;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease;
}

.shift-cell:hover {
  transform: translateY(-1px);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 0 15px 15px;
}

@media (max-width: 768px) {
  .query-actions-row,
  .batch-actions-row,
  .filter-col,
  .filter-col-month,
  .batch-day-col,
  .batch-shift-col {
    width: 100%;
  }
}
</style>