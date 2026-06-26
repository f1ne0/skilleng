import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { IsEmail, IsOptional, IsUUID } from "class-validator";
import { CreateGroupDto } from "./dto/create-group.dto";
import { JoinGroupDto } from "./dto/join-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { GroupsService } from "./groups.service";

class AddMemberDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

@ApiTags("Groups")
@Controller("groups")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // ===== CREATE (только TEACHER) =====
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Create a group (TEACHER only)" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.id, dto);
  }

  // ===== LIST MY GROUPS =====
  @Get("my")
  @ApiOperation({ summary: "My groups (owned + memberships)" })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.findMine(user.id);
  }

  // ===== JOIN BY INVITE CODE =====
  @Post("join")
  @ApiOperation({ summary: "Join group by invite code" })
  join(@CurrentUser() user: AuthenticatedUser, @Body() dto: JoinGroupDto) {
    return this.groupsService.join(user.id, dto);
  }

  // ===== ALL STUDENTS ACROSS OWNED GROUPS (TEACHER) =====
  @Get("students")
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "All students across the teacher's groups, with stats" })
  allStudents(@CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.listAllStudents(user.id);
  }

  // ===== GET ONE =====
  @Get(":id")
  @ApiOperation({ summary: "Get group details with members" })
  findById(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.findById(id, user.id);
  }

  // ===== UPDATE =====
  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Update group (owner only)" })
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, user.id, dto);
  }

  // ===== DELETE =====
  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Delete group (owner only)" })
  delete(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.delete(id, user.id);
  }

  // ===== REGENERATE INVITE CODE =====
  @Post(":id/regenerate-code")
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Generate a new invite code" })
  regenerateCode(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.groupsService.regenerateInviteCode(id, user.id);
  }

  // ===== LEAVE =====
  @Delete(":id/leave")
  @ApiOperation({ summary: "Leave group (members)" })
  leave(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.leave(id, user.id);
  }

  // ===== ADD MEMBER =====
  @Post(":id/members")
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Add a student to the group by email or userId (owner only)" })
  addMember(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddMemberDto,
  ) {
    return dto.userId
      ? this.groupsService.addMemberById(id, user.id, dto.userId)
      : this.groupsService.addMemberByEmail(id, user.id, dto.email ?? '')
  }

  // ===== REMOVE MEMBER =====
  @Delete(":groupId/members/:userId")
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Remove a member from group (owner only)" })
  removeMember(
    @Param("groupId") groupId: string,
    @Param("userId") userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.groupsService.removeMember(groupId, user.id, userId);
  }

  // ===== ANALYTICS =====
  @Get(":id/analytics")
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Group analytics (owner only)" })
  analytics(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.getAnalytics(id, user.id);
  }

  // ===== STUDENT DETAIL =====
  @Get(":groupId/members/:userId/detail")
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Detailed view of a student in your group" })
  studentDetail(
    @Param("groupId") groupId: string,
    @Param("userId") userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.groupsService.getStudentDetail(groupId, userId, user.id);
  }
}
