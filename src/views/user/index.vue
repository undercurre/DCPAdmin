<template>
  <div class="card" style="height: 100%">
    <el-table :data="tableData" style="width: 100%; height: 100%">
      <el-table-column fixed prop="username" label="Name" width="120" />
      <el-table-column prop="email" label="Email" width="240" />
      <el-table-column prop="phone" label="Phone" width="120" />
      <el-table-column prop="created_at" label="CreateTime" width="320" />
      <el-table-column prop="updated_at" label="UpdateTime" width="320" />
      <!-- <el-table-column :fixed="false" prop="updated_at" label="ToDo" min-width="120">
        <template #default>
          <el-button link type="primary" size="small"> Detail </el-button>
          <el-button link type="primary" size="small">Edit</el-button>
        </template>
      </el-table-column> -->
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { User } from "@/api/interface/user";
import { getUserList } from "@/api/modules/user";
import { onBeforeMount, ref } from "vue";

import { ElTable } from "element-plus";

let tableData = ref<Array<User.Entity>>([]);

onBeforeMount(async () => {
  const listRes = await getUserList();

  console.log(listRes.data);

  tableData.value = listRes.data;
});
</script>
