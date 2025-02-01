# 后端

nestjs微服务

注意：开发时记得使用 `pnpm postbuild` 获取密钥到正确目录

sso-garden 作为sso验证模块 port:3000
pomms 用户信息管理模块 port:3003
bill-collection 账单管理模块 port:3004

# DCPAdmin

集中式管理后台

## 设计数据结构

### SQL

```sql
CREATE TABLE `daily_expenses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消费记录ID',
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '关联用户ID',
  `amount` decimal(10,2) NOT NULL COMMENT '消费金额',
  `category` varchar(50) NOT NULL COMMENT '消费类别，例如：餐饮、交通、购物',
  `description` varchar(255) DEFAULT NULL COMMENT '消费详情描述',
  `expense_date` date NOT NULL COMMENT '消费日期',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_user_expenses` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='日常消费记录表，记录用户的消费数据';
```

如：

### id

唯一标识每一条消费记录，使用 char(36)，可存储 UUID。

### user_id

用于关联 user 表中的用户，建立外键关联。

### amount

消费金额，使用 decimal(10,2)，精确到小数点后两位，支持最大值为 99999999.99。

### category

消费类别，如餐饮、交通、购物等，用于对消费进行分类。

### description

可选字段，用于描述消费详情，例如 "购买书籍"。

### expense_date

消费的日期，方便按日期统计或查询。

### created_at

记录创建时间，默认值为当前时间戳。

### 外键约束

fk_user_expenses：user_id 外键关联 user 表的 id 字段，支持级联删除（ON DELETE CASCADE），即删除用户时会自动删除该用户的消费记录。

## 新建模块子应用

1. 新建nest应用 `nest new [子应用名称]`

2. 更新换行符`npx prettier --write --end-of-line lf .`

## 实现模块代码

```
nest g mo daily-expenses
nest g s daily-expenses --no-spec
nest g co daily-expenses --no-spec
```

### 新建数据结构实体

如：daily-expenses.entity.ts

```ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "../user/user.entity"; // 假设 User 实体位于 ../user/user.entity

@Entity("daily_expenses")
export class DailyExpense {
  @PrimaryGeneratedColumn("uuid")
  id: string; // 消费记录ID，使用 UUID

  @ManyToOne(() => User, user => user.expenses, { onDelete: "CASCADE" })
  user: User; // 关联的用户，设置为多对一关系

  @Column("decimal", { precision: 10, scale: 2 })
  amount: number; // 消费金额

  @Column({ type: "varchar", length: 50 })
  category: string; // 消费类别

  @Column({ type: "varchar", length: 255, nullable: true })
  description?: string; // 消费详情描述

  @Column({ type: "date" })
  expenseDate: string; // 消费日期

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date; // 记录创建时间，自动生成
}
```

### 关联`User`实体

```ts
import { Entity, Column, CreateDateColumn, BeforeInsert, UpdateDateColumn, PrimaryColumn, OneToOne } from "typeorm";
import { Exclude } from "class-transformer";
import SnowflakeId from "snowflake-id";
import { DailyExpense } from "src/daily-expenses/daily-expenses.entity";

const snowflake = new SnowflakeId({
  mid: 42,
  offset: (2020 - 1970) * 31536000 * 1000
});

@Entity("users")
export class User {
  @PrimaryColumn({ type: "char", length: 20 })
  id: string;

  @Column({ unique: true })
  username: string;

  @Exclude() // 这个字段将不会被序列化
  @Column()
  password: string;

  @Exclude() // 这个字段将不会被序列化
  @Column()
  salt: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => DailyExpense, dailyExpense => dailyExpense.user)
  dailyExpense: DailyExpense;

  @BeforeInsert()
  generateId() {
    this.id = snowflake.generate().toString();
  }
}
```

### 编写dto

```ts
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from "class-validator";

export class CreateDailyExpenseDto {
  @IsNotEmpty()
  @IsString()
  userId: string; // 用户ID

  @IsNotEmpty()
  @IsNumber()
  amount: number; // 消费金额

  @IsNotEmpty()
  @IsString()
  category: string; // 消费类别

  @IsOptional()
  @IsString()
  description?: string; // 消费详情描述

  @IsNotEmpty()
  @IsDateString()
  expenseDate: string; // 消费日期
}
```

### 编写控制器

```ts
import { Controller, Get, Post, Body, Param, Delete, Query } from "@nestjs/common";
import { DailyExpensesService } from "./daily-expenses.service";
import { CreateDailyExpenseDto } from "./daily-expenses.dto";

@Controller("daily-expenses")
export class DailyExpensesController {
  constructor(private readonly dailyExpensesService: DailyExpensesService) {}

  @Post()
  async create(@Body() createDailyExpenseDto: CreateDailyExpenseDto) {
    return this.dailyExpensesService.create(createDailyExpenseDto);
  }

  @Get()
  async findAll(@Query("userId") userId: string) {
    return this.dailyExpensesService.findAll(userId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.dailyExpensesService.findOne(id);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.dailyExpensesService.remove(id);
  }
}
```

### 编写`service`

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DailyExpense } from "./daily-expenses.entity";
import { CreateDailyExpenseDto } from "./daily-expenses.dto";

@Injectable()
export class DailyExpensesService {
  constructor(
    @InjectRepository(DailyExpense)
    private readonly dailyExpenseRepository: Repository<DailyExpense>
  ) {}

  async create(createDailyExpenseDto: CreateDailyExpenseDto): Promise<DailyExpense> {
    const expense = this.dailyExpenseRepository.create(createDailyExpenseDto);
    return this.dailyExpenseRepository.save(expense);
  }

  async findAll(userId: string): Promise<DailyExpense[]> {
    return this.dailyExpenseRepository.find({
      where: { user: { id: userId } },
      relations: ["user"] // 关联用户信息
    });
  }

  async findOne(id: string): Promise<DailyExpense> {
    const expense = await this.dailyExpenseRepository.findOne({
      where: { id },
      relations: ["user"]
    });
    if (!expense) {
      throw new NotFoundException(`Daily expense with ID "${id}" not found.`);
    }
    return expense;
  }

  async remove(id: string): Promise<void> {
    const result = await this.dailyExpenseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Daily expense with ID "${id}" not found.`);
    }
  }
}
```

### 编写`module`

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DailyExpensesService } from "./daily-expenses.service";
import { DailyExpensesController } from "./daily-expenses.controller";
import { DailyExpense } from "./daily-expenses.entity";
import { User } from "../users/users.entity"; // 关联 User 实体

@Module({
  imports: [TypeOrmModule.forFeature([DailyExpense, User])],
  controllers: [DailyExpensesController],
  providers: [DailyExpensesService]
})
export class DailyExpensesModule {}
```

### 配置数据库

在`app.module.ts`配置

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "mysql",
      host: "localhost", // MySQL 地址
      port: 3306, // 默认端口
      username: "root", // 数据库用户名
      password: "password", // 数据库密码
      database: "mydb", // 数据库名
      entities: [], // 在这里指定你所有的实体类
      synchronize: true // 开发阶段可以设置为 true, 在生产环境中建议设置为 false
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
```

### 使用环境变量

在`app.module.ts`配置

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRootAsync({
      isGlobal: true, // 使环境变量在整个应用中都可用
      envFilePath: ".env" // 指定 .env 文件路径
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService], // 注入 ConfigService
      useFactory: async (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get<string>("DB_HOST"), // MySQL 地址
        port: configService.get<number>("DB_PORT"), // 默认端口
        username: configService.get<string>("DB_USERNAME"), // 数据库用户名
        password: configService.get<string>("DB_PASSWORD"), // 数据库密码
        database: configService.get<string>("DB_DATABASE"), // 数据库名
        entities: [User], // 在这里指定你所有的实体类
        synchronize: true // 开发阶段可以设置为 true, 在生产环境中建议设置为 false
      })
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
```

### 加入返回拦截器

```ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class ResponceInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        code: 200,
        msg: "Success",
        data
      }))
    );
  }
}
```

在`main.ts`

```ts
app.useGlobalInterceptors(new ResponceInterceptor());
```

### 增加jwt守卫

创建一个加密策略`jwt.strategy.ts`

```ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 从请求头中提取 token
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") //  用来验证 token 的签名
    });
  }

  // 解析token的钩子
  async validate(payload: { sub: string; username: string }) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

创建一个守卫`jwt-auth.guard.ts`来使用jwt策略：这样做的好处是，如果你以后需要对认证逻辑进行修改或扩展（比如添加额外的验证），你只需要修改 JwtAuthGuard 类，而不必在每个需要验证的路由中重复编写相同的逻辑。

```ts
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
```

创建一个`auth.module.ts`用于把整个验证过程集成到一个模块中，并集成到`app.module.ts`

```ts
// auth.module.ts
import { Module } from "@nestjs/common";
import { JwtStrategy } from "./guard/jwt/jwt.strategy";

@Module({
  providers: [JwtStrategy]
})
export class AuthModule {}
```

使用这个守卫

```ts
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createDailyExpenseDto: Omit<CreateDailyExpenseDto, 'userId'>,
    @Request() req,
  ) {
    console.log(req.user);
    return this.dailyExpensesService.create({
      userId: req.user.userId,
      ...createDailyExpenseDto,
    });
  }
```

守卫应用全局

在`app.module.ts`中使用全局令牌部署守卫

```ts
providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 将 JwtAuthGuard 设置为全局守卫
    },
  ],
```

设置`@isPublic`装饰器

新建一个`public.decorator.ts`

```ts
// public.decorator.ts
// 定义装饰器
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

重写`JwtAuthGuard`

```ts
import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core/services"; // 用来读取装饰器
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  // 构造函数
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 检查是否使用了指定的装饰器
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler()]);
    if (isPublic) {
      return true; // 如果有 SkipAuth 装饰器，跳过认证
    }
    return super.canActivate(context); // 否则继续执行 JWT 验证
  }
}
```
