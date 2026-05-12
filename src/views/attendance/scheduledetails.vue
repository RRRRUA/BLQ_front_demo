<script setup>
import { computed, onMounted, ref } from 'vue'
import { useEmployeesStore, useDepartmentStore } from '@/stores'
import { exportToXls } from '@/utils/exportXls'
import { ElMessage } from 'element-plus'

const employeesStore = useEmployeesStore()
const departmentStore = useDepartmentStore()

const employees = computed(() => employeesStore.employees || [])
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

const departments = computed(() => departmentStore.departments || [])

const departmentOptions = computed(() => {
	return departments.value
		.map((dept) => ({
			id: dept.DeptID ?? dept.departmentID ?? dept.departmentId ?? dept.id,
			name: dept.DeptName ?? dept.departmentName ?? dept.name,
			parentId: dept.SuperiorDept ?? dept.parentId ?? dept.parentID ?? dept.parent
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

const getMonthWorkDays = (monthDate) => {
	const year = monthDate.getFullYear()
	const month = monthDate.getMonth()
	const days = new Date(year, month + 1, 0).getDate()
	let workDays = 0

	for (let day = 1; day <= days; day++) {
		const date = new Date(year, month, day)
		const weekDay = date.getDay()
		if (weekDay !== 0 && weekDay !== 6) {
			workDays += 1
		}
	}

	return workDays
}

const getSeed = (text) => {
	return String(text || '')
		.split('')
		.reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
}

const buildAttendanceDetail = (emp) => {
	const seed = getSeed(`${emp.staffID}-${selectedMonthText.value}`)
	const shouldAttendanceDays = getMonthWorkDays(queriedMonth.value)
	const previousMonthLeave = 2 + seed % 6
	const currentMonthGrantedLeave = 1 + Math.floor(seed / 3) % 3
	const annualLeaveDays = Math.floor(seed / 5) % 4
	const holidayDays = Math.floor(seed / 7) % 5
	const overtimeHours = (Math.floor(seed / 11) % 8) * 1.5
	const actualAttendanceDays = Math.max(shouldAttendanceDays - annualLeaveDays - holidayDays, 0)
	const remainingLeaveDays = Math.max(
		previousMonthLeave + currentMonthGrantedLeave - annualLeaveDays,
		0
	)

	return {
		...emp,
		accountingMonth: selectedMonthText.value,
		previousMonthLeave,
		currentMonthGrantedLeave,
		actualAttendanceDays,
		overtimeHours: Number(overtimeHours.toFixed(1)),
		annualLeaveDays,
		remainingLeaveDays,
		holidayDays
	}
}

const attendanceDetails = computed(() => {
	if (!hasSearched.value || !queriedMonth.value) {
		return []
	}
	return employees.value.map(buildAttendanceDetail)
})

const filteredAttendanceDetails = computed(() => {
	return attendanceDetails.value.filter((row) => {
		if (selectedPrimaryDeptName.value) {
			const currentDept = departmentOptions.value.find(d => d.name === row.staffDept)
			if (!currentDept || currentDept.parentId !== primaryDeptId.value) {
				return false
			}
		}

		if (secondaryDeptName.value && row.staffDept !== secondaryDeptName.value) {
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

const paginatedAttendanceDetails = computed(() => {
	pagination.value.total = filteredAttendanceDetails.value.length
	const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
	const end = start + pagination.value.pageSize
	return filteredAttendanceDetails.value.slice(start, end)
})

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

const handleMonthChange = () => {
	pagination.value.currentPage = 1
}

const handleQuery = () => {
	if (!(monthFilter.value instanceof Date)) {
		ElMessage.warning('请先选择查询月份')
		return
	}

	queriedMonth.value = new Date(monthFilter.value.getFullYear(), monthFilter.value.getMonth(), 1)
	hasSearched.value = true
	pagination.value.currentPage = 1
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
	pagination.value.currentPage = 1
}

const handleExportAttendanceDetails = () => {
	if (!hasSearched.value) {
		ElMessage.warning('请先选择月份并点击查询')
		return
	}

	if (!filteredAttendanceDetails.value.length) {
		ElMessage.warning('暂无可导出的考勤明细')
		return
	}

	const rows = [
		['工号', '姓名', '岗位', '月份', '上月余假', '本月给假', '本月实出勤', '加班', '年假', '余假', '放假']
	]

	filteredAttendanceDetails.value.forEach((row) => {
		rows.push([
			row.staffID,
			row.staffName,
			getPositionDisplay(row),
			row.accountingMonth,
			row.previousMonthLeave,
			row.currentMonthGrantedLeave,
			row.actualAttendanceDays,
			row.overtimeHours,
			row.annualLeaveDays,
			row.remainingLeaveDays,
			row.holidayDays
		])
	})

	exportToXls({
		fileName: `考勤明细_${selectedMonthText.value}`,
		sheetName: '考勤明细',
		rows,
		columnWidths: [
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 24 },
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 12 },
			{ wch: 12 },
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 10 }
		]
	})

	ElMessage.success('考勤明细导出成功')
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
			<div class="page-title">考勤明细查询</div>
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
						@change="handleMonthChange"
					/>
				</div>
				<div class="filter-col">
					<el-select v-model="primaryDeptId" placeholder="一级部门" class="filter-select" @change="handlePrimaryDeptChange">
						<el-option label="全部部门" value="" />
						<el-option
							v-for="dept in primaryDepartments"
							:key="dept.id"
							:label="dept.name"
							:value="dept.id"
						/>
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
						<el-option
							v-for="dept in secondaryDepartments"
							:key="dept.id"
							:label="dept.name"
							:value="dept.name"
						/>
					</el-select>
				</div>
				<div class="filter-col">
					<el-select
						v-model="positionFilter"
						placeholder="职级"
						class="filter-select"
						clearable
						@change="handleFilterChange"
					>
						<el-option
							v-for="pos in positionOptions"
							:key="pos"
							:label="pos"
							:value="pos"
						/>
					</el-select>
				</div>
				<div class="filter-col">
					<el-input
						v-model="nameFilter"
						placeholder="按姓名筛选"
						clearable
						@input="handleFilterChange"
					/>
				</div>
			</div>

			<div class="query-actions-row">
				<el-button type="primary" @click="handleQuery">查询</el-button>
				<el-button @click="resetFilters">重置筛选</el-button>
				<el-button type="primary" @click="handleExportAttendanceDetails">导出</el-button>
			</div>

		</div>

		<div class="subtitle">
			{{ hasSearched ? `当前查询 ${selectedMonthText} 月份的考勤明细` : '请选择月份并点击查询' }}
		</div>

		<el-table
			:data="paginatedAttendanceDetails"
			class="attendance-table"
			style="width: 100%"
			v-loading="loading"
			empty-text="请选择月份并点击查询"
			border
			stripe
			highlight-current-row
		>
			<el-table-column type="selection" width="40" align="center" />
			<el-table-column prop="staffID" label="工号" min-width="80" align="center" />
			<el-table-column prop="staffName" label="姓名" min-width="90" align="center" />
			<el-table-column label="岗位" min-width="200" align="center" show-overflow-tooltip>
				<template #default="scope">
					{{ getPositionDisplay(scope.row) }}
				</template>
			</el-table-column>
			<el-table-column prop="accountingMonth" label="月份" min-width="90" align="center" />
			<el-table-column prop="previousMonthLeave" label="上月余假" min-width="90" align="center" />
			<el-table-column prop="currentMonthGrantedLeave" label="本月给假" min-width="90" align="center" />
			<el-table-column prop="actualAttendanceDays" label="本月实出勤" min-width="100" align="center" />
			<el-table-column prop="overtimeHours" label="加班" min-width="80" align="center" />
			<el-table-column prop="annualLeaveDays" label="年假" min-width="80" align="center" />
			<el-table-column prop="remainingLeaveDays" label="余假" min-width="80" align="center" />
			<el-table-column prop="holidayDays" label="放假" min-width="80" align="center" />
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

.form-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.query-actions-row {
	display: flex;
	flex-wrap: wrap;
}

.filter-col {
	width: 124px;
}

.filter-col-month {
	width: 136px;
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

.attendance-table {
	--attendance-header-bg: #f5f8ff;
	--attendance-grid-color: #c2ccda;
	--el-table-border-color: var(--attendance-grid-color);
	--el-table-border: 1px solid var(--attendance-grid-color);
}

.attendance-table :deep(.el-table__header-wrapper thead th) {
	background: var(--attendance-header-bg);
	color: #000;
	font-weight: 700;
}

.attendance-table :deep(.el-table__cell) {
	border-right: 1px solid var(--attendance-grid-color);
}

.attendance-table :deep(.el-table tr td) {
	border-bottom: 1px solid var(--attendance-grid-color);
}

.pagination-container {
	display: flex;
	justify-content: flex-end;
	margin-top: 20px;
	padding: 0 15px 15px;
}

@media (max-width: 768px) {
	.form-actions {
		width: 100%;
	}

	.query-actions-row {
		width: 100%;
	}

	.filter-col,
	.filter-col-month {
		width: 100%;
	}
}
</style>
