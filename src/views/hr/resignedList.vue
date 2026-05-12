<script setup>
import { useDepartmentStore } from '@/stores'
import {
  Delete,
  Edit
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const departmentStore = useDepartmentStore()

// 部门列表
const departments = computed(() => departmentStore.departments || [])

// 部门选项，写法保持和员工信息维护一致
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

const departmentPathOptions = computed(() => {
  return departmentOptions.value
    .filter(d => d.parentId !== -1 && d.parentId !== null && d.parentId !== undefined)
    .map((dept) => {
      const parent = departmentOptions.value.find(d => d.id === dept.parentId)

      return {
        id: dept.id,
        name: dept.name,
        fullName: parent ? `${parent.name}-${dept.name}` : dept.name
      }
    })
})

// 离职人员名单数据：目前先使用前端模拟数据
const resignedEmployees = ref([
  {
    staffID: 'L001',
    staffName: '赵一',
    staffGender: '男',
    staffPhone: '13900139001',
    staffDept: '行政部-中心区域（夜班）',
    staffPos: '经理',
    staffHireDate: '2019-03-15',
    staffBirthday: '1988-06-12'
  },
  {
    staffID: 'L002',
    staffName: '钱二',
    staffGender: '女',
    staffPhone: '13900139002',
    staffDept: '行政部-峡谷游船组',
    staffPos: '主管',
    staffHireDate: '2020-07-20',
    staffBirthday: '1992-09-08'
  },
  {
    staffID: 'L003',
    staffName: '孙三',
    staffGender: '男',
    staffPhone: '13900139003',
    staffDept: '行政部-司机班',
    staffPos: '司机',
    staffHireDate: '2018-05-10',
    staffBirthday: '1986-11-25'
  },
  {
    staffID: 'L004',
    staffName: '李四',
    staffGender: '女',
    staffPhone: '13900139004',
    staffDept: '行政部-一线考勤组（排班）',
    staffPos: '专员',
    staffHireDate: '2021-02-18',
    staffBirthday: '1995-04-19'
  },
  {
    staffID: 'L005',
    staffName: '周五',
    staffGender: '男',
    staffPhone: '13900139005',
    staffDept: '行政部-动力维修部（指挥中心、电工）',
    staffPos: '助理',
    staffHireDate: '2020-10-09',
    staffBirthday: '1993-12-03'
  },
  {
    staffID: 'L006',
    staffName: '吴六',
    staffGender: '女',
    staffPhone: '13900139006',
    staffDept: '行政部-中心区域（夜班）',
    staffPos: '出纳',
    staffHireDate: '2022-01-12',
    staffBirthday: '1996-08-21'
  },
  {
    staffID: 'L007',
    staffName: '郑七',
    staffGender: '男',
    staffPhone: '13900139007',
    staffDept: '行政部-一线考勤组',
    staffPos: '司机',
    staffHireDate: '2017-09-05',
    staffBirthday: '1985-02-17'
  }
])

// 对话框可见性
const dialogVisible = ref(false)

// 当前编辑的离职员工
const currentEmployee = reactive({
  staffID: '',
  staffName: '',
  staffGender: '',
  staffPhone: '',
  staffDept: '',
  staffPos: '',
  staffHireDate: '',
  staffBirthday: ''
})

// 分页相关变量
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 筛选条件
const primaryDeptId = ref('')
const secondaryDeptName = ref('')
const positionFilter = ref('')
const hireDateStart = ref('')
const hireDateEnd = ref('')
const nameFilter = ref('')

const selectedPrimaryDeptName = computed(() => {
  if (!primaryDeptId.value) {
    return ''
  }

  const primary = departmentOptions.value.find(d => d.id === primaryDeptId.value)
  return primary?.name || ''
})

const positionOptions = computed(() => {
  const options = new Set(
    resignedEmployees.value
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

const parseDepartment = (deptName) => {
  const formatted = getDepartmentDisplay(deptName)

  if (!formatted) {
    return {
      primary: '',
      secondary: ''
    }
  }

  const parts = formatted.split('-')

  return {
    primary: parts[0] || '',
    secondary: parts[1] || ''
  }
}

// 过滤后的离职员工列表
const filteredEmployees = computed(() => {
  return resignedEmployees.value.filter((emp) => {
    const { primary, secondary } = parseDepartment(emp.staffDept)

    if (selectedPrimaryDeptName.value && primary !== selectedPrimaryDeptName.value) {
      return false
    }

    if (secondaryDeptName.value && secondary !== secondaryDeptName.value) {
      return false
    }

    if (positionFilter.value && emp.staffPos !== positionFilter.value) {
      return false
    }

    if (nameFilter.value && !String(emp.staffName || '').includes(nameFilter.value.trim())) {
      return false
    }

    if (hireDateStart.value && (!emp.staffHireDate || emp.staffHireDate < hireDateStart.value)) {
      return false
    }

    if (hireDateEnd.value && (!emp.staffHireDate || emp.staffHireDate > hireDateEnd.value)) {
      return false
    }

    return true
  })
})

// 分页后的离职员工列表
const paginatedEmployees = computed(() => {
  pagination.value.total = filteredEmployees.value.length

  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize

  return filteredEmployees.value.slice(start, end)
})

// 处理分页变化
const handleCurrentChange = (val) => {
  pagination.value.currentPage = val
}

// 处理每页数量变化
const handleSizeChange = (val) => {
  pagination.value.pageSize = val
  pagination.value.currentPage = 1
}

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

const resetFilters = () => {
  primaryDeptId.value = ''
  secondaryDeptName.value = ''
  positionFilter.value = ''
  hireDateStart.value = ''
  hireDateEnd.value = ''
  nameFilter.value = ''
  pagination.value.currentPage = 1
}

const goBack = () => {
  router.push('/hr/employeesInfo')
}

// 打开编辑对话框
const openEditDialog = (emp) => {
  Object.assign(currentEmployee, JSON.parse(JSON.stringify(emp)))
  dialogVisible.value = true
}

const isEditingEmployee = computed(() => {
  return resignedEmployees.value.some(e => e.staffID === currentEmployee.staffID)
})

// 保存离职员工信息
const saveEmployee = () => {
  if (!currentEmployee.staffID || !currentEmployee.staffName) {
    ElMessage.warning('请填写必填字段')
    return
  }

  const index = resignedEmployees.value.findIndex(e => e.staffID === currentEmployee.staffID)

  if (index !== -1) {
    resignedEmployees.value[index] = {
      ...currentEmployee
    }

    ElMessage.success('保存成功')
  }

  dialogVisible.value = false
}

// 删除离职员工
const handleDelete = (emp) => {
  ElMessageBox.confirm(
    `确定要删除离职人员 "${emp.staffName}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = resignedEmployees.value.findIndex(e => e.staffID === emp.staffID)

    if (index !== -1) {
      resignedEmployees.value.splice(index, 1)
      ElMessage.success('删除成功')
    }

    if (currentEmployee.staffID === emp.staffID) {
      dialogVisible.value = false
    }
  }).catch(() => {
    // 用户取消
  })
}

// 加载数据
const loadData = () => {
  departmentStore.loadDepartments()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="template-container">
    <div class="template-header">
      <div class="page-title">离职人员名单</div>
    </div>

    <div class="search-form-container">
      <div class="form-actions">
        <el-button @click="goBack">返回员工信息维护</el-button>
      </div>

      <div class="filters-row">
        <div class="filter-col">
          <el-select
            v-model="primaryDeptId"
            placeholder="一级部门"
            class="filter-select"
            @change="handlePrimaryDeptChange"
          >
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

        <div class="filter-col filter-col-date">
          <el-date-picker
            v-model="hireDateStart"
            type="date"
            placeholder="入职开始日期"
            class="filter-select"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            @change="handleFilterChange"
          />
        </div>

        <div class="filter-col filter-col-date">
          <el-date-picker
            v-model="hireDateEnd"
            type="date"
            placeholder="入职结束日期"
            class="filter-select"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            @change="handleFilterChange"
          />
        </div>

        <div class="filter-col">
          <el-input
            v-model="nameFilter"
            placeholder="按姓名筛选"
            clearable
            @input="handleFilterChange"
          />
        </div>

        <div class="form-actions">
          <el-button @click="resetFilters">重置筛选</el-button>
        </div>
      </div>
    </div>

    <el-table
      :data="paginatedEmployees"
      style="width: 100%"
      border
      stripe
      highlight-current-row
    >
      <el-table-column
        prop="staffID"
        label="工号"
        min-width="60"
        align="center"
      />

      <el-table-column
        prop="staffName"
        label="姓名"
        min-width="100"
        align="center"
      />

      <el-table-column
        prop="staffGender"
        label="性别"
        min-width="60"
        align="center"
      />

      <el-table-column
        prop="staffPhone"
        label="手机号码"
        min-width="120"
        align="center"
      />

      <el-table-column
        label="所属部门"
        min-width="180"
        align="center"
      >
        <template #default="scope">
          {{ getDepartmentDisplay(scope.row.staffDept) }}
        </template>
      </el-table-column>

      <el-table-column
        prop="staffPos"
        label="职级"
        min-width="100"
        align="center"
      />

      <el-table-column
        prop="staffHireDate"
        label="入职日期"
        min-width="100"
        align="center"
      />

      <el-table-column
        prop="staffBirthday"
        label="出生日期"
        min-width="100"
        align="center"
      />

      <el-table-column
        label="操作"
        width="120"
        fixed="right"
        align="center"
      >
        <template #default="scope">
          <el-button-group>
            <el-button
              @click="openEditDialog(scope.row)"
              :icon="Edit"
            >
              编辑
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
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

    <!-- 离职员工编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑离职人员信息"
      width="700px"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="工号"
              required
            >
              <el-input
                v-model="currentEmployee.staffID"
                placeholder="请输入工号"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item
              label="姓名"
              required
            >
              <el-input
                v-model="currentEmployee.staffName"
                placeholder="请输入姓名"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="性别"
              required
            >
              <el-select
                v-model="currentEmployee.staffGender"
                placeholder="请选择性别"
                style="width: 100%"
              >
                <el-option
                  label="男"
                  value="男"
                />

                <el-option
                  label="女"
                  value="女"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item
              label="手机号码"
              required
            >
              <el-input
                v-model="currentEmployee.staffPhone"
                placeholder="请输入手机号码"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="所属部门"
              required
            >
              <el-select
                v-model="currentEmployee.staffDept"
                placeholder="请选择部门"
                style="width: 100%"
              >
                <el-option
                  v-for="dept in departmentPathOptions"
                  :key="dept.id"
                  :label="dept.fullName"
                  :value="dept.fullName"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="职级">
              <el-input
                v-model="currentEmployee.staffPos"
                placeholder="请输入职级"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入职日期">
              <el-date-picker
                v-model="currentEmployee.staffHireDate"
                type="date"
                placeholder="选择入职日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-date-picker
                v-model="currentEmployee.staffBirthday"
                type="date"
                placeholder="选择出生日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button
          v-if="isEditingEmployee"
          type="danger"
          :icon="Delete"
          @click="handleDelete(currentEmployee)"
        >
          删除
        </el-button>

        <el-button @click="dialogVisible = false">
          取消
        </el-button>

        <el-button
          type="primary"
          @click="saveEmployee"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
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
  margin-bottom: 50px;
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
  gap: 10px;
  align-items: center;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
}

.filter-col {
  width: 200px;
}

.filter-col-date {
  width: 260px;
}

.filter-select {
  width: 100%;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 0 15px 15px;
}

@media (max-width: 768px) {
  .filter-col,
  .filter-col-date {
    width: 100%;
  }
}
</style>